'use server'

import { revalidatePath } from 'next/cache'
import { startDonation } from '@/lib/checkout'
import { getDb } from '@/lib/db'
import { donorCampaigns, donorChildren, donorKey, donorPreferences, ownedDonation, type DonorPreferences, type UpdateStatus } from '@/lib/donor'
import { formatUGX } from '@/lib/format'
import { alertDonor } from '@/lib/notify'
import { currentAccount } from '@/lib/supabase/session'
import type { Beneficiary, CampaignStatus, DonorLearnerInput, EducationLevel } from '@/lib/types'

function refresh() {
  for (const path of ['/dashboard', '/dashboard/donations', '/dashboard/receipts', '/dashboard/campaigns', '/dashboard/sponsored', '/dashboard/updates', '/dashboard/notifications', '/dashboard/settings', '/dashboard/profile', '/campaigns', '/sponsor', '/donate', '/admin/campaigns', '/admin/beneficiaries', '/admin/updates', '/admin']) {
    revalidatePath(path)
  }
}

async function donorEmail() {
  const account = await currentAccount()
  if (!account?.email) throw new Error('Sign in to change your records.')
  return account.email
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

async function result<T>(operation: PromiseLike<{ data: T; error: { message: string } | null }>, context: string): Promise<T> {
  const { data, error } = await operation
  if (error) throw new Error(`Could not ${context}: ${error.message}`)
  return data
}

export async function createDonationRecord(input: { amount: number; message: string; campaignId?: string; beneficiaryId?: string }) {
  const email = await donorEmail()
  const account = await currentAccount()
  const amount = Math.round(Number(input.amount))
  if (!amount || amount < 500) throw new Error('Enter an amount of at least 500 UGX.')
  const support = input.beneficiaryId ? 'child' : input.campaignId ? 'campaign' : 'general'
  const today = new Date().toISOString().slice(0, 10)
  const donationId = id('d')
  const reference = `NOTE-${Date.now().toString(36).toUpperCase()}`
  const db = getDb()
  await result(db.from('donations').insert({
    id: donationId, donor_name: account?.name || 'Donor', anonymous: false, email, phone: account?.phone || '',
    amount, frequency: 'one-time', campaign_id: input.campaignId || null, beneficiary_id: input.beneficiaryId || null,
    support_target: support, method: 'Recorded', transaction_id: reference, date: today, status: 'Pending',
    message: input.message.trim(), created_at: new Date().toISOString(),
  }), 'record donation')
  await result(db.from('transactions').insert({
    id: id('pt'), donation_id: donationId, provider: 'Recorded', reference, amount, status: 'Pending', date: today,
  }), 'record donation transaction')
  await alertDonor(email, { title: 'Gift recorded', body: `${formatUGX(amount)} is saved as pending. Reference ${reference}.`, kind: 'gift', href: '/dashboard/donations' })
  refresh()
}

export async function updateDonationMessage(donationId: string, message: string) {
  const email = await donorEmail()
  if (!await ownedDonation(email, donationId)) throw new Error('That gift is not on your account.')
  const updated = await result(getDb().from('donations').update({ message: message.trim() }).eq('id', donationId).ilike('email', donorKey(email)).select('id'), 'update donation message')
  if (!updated?.length) throw new Error('That gift is not on your account.')
  refresh()
}

export async function deleteDonationRecord(donationId: string) {
  const email = await donorEmail()
  if (!await ownedDonation(email, donationId)) throw new Error('That gift is not on your account.')
  const db = getDb()
  await result(db.from('transactions').delete().eq('donation_id', donationId), 'delete donation transactions')
  const deleted = await result(db.from('donations').delete().eq('id', donationId).ilike('email', donorKey(email)).select('id'), 'delete donation')
  if (!deleted?.length) throw new Error('That gift is not on your account.')
  refresh()
}

export async function retryDonation(donationId: string) {
  const email = await donorEmail()
  const donation = await ownedDonation(email, donationId)
  if (!donation) throw new Error('That gift is not on your account.')
  if (donation.status !== 'Failed' && donation.status !== 'Cancelled') throw new Error('This gift cannot be paid again.')
  const result = await startDonation({
    amount: donation.amount,
    frequency: donation.frequency,
    supportTarget: donation.supportTarget,
    campaignId: donation.campaignId,
    beneficiaryId: donation.beneficiaryId,
    name: donation.anonymous ? '' : donation.donorName,
    email: donation.email,
    phone: donation.phone,
    message: donation.anonymous ? '' : (donation.message?.trim() || 'Education gift'),
    anonymous: donation.anonymous,
  })
  refresh()
  return result
}

const levels = new Set<EducationLevel>(['Nursery', 'Primary', 'Secondary', 'University'])
const statuses = new Set<CampaignStatus>(['draft', 'active', 'paused', 'completed', 'archived'])

export type DonorCampaignInput = {
  title: string
  summary: string
  category: string
  level: string
  location: string
  target: number
  deadline: string
  status: string
}

function campaignInput(input: DonorCampaignInput) {
  const title = input.title.trim()
  if (!title) throw new Error('Add a campaign title.')
  if (!levels.has(input.level as EducationLevel)) throw new Error('Choose an education level.')
  if (!statuses.has(input.status as CampaignStatus)) throw new Error('Choose a status.')
  const target = Math.round(Number(input.target))
  if (!Number.isFinite(target) || target < 0) throw new Error('Enter a target of zero or more.')
  return {
    title,
    summary: input.summary.trim(),
    category: input.category.trim() || 'School Fees',
    level: input.level,
    location: input.location.trim(),
    target,
    deadline: input.deadline || new Date().toISOString().slice(0, 10),
    status: input.status,
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'campaign'
}

export async function createDonorCampaign(input: DonorCampaignInput) {
  const email = await donorEmail()
  const fields = campaignInput(input)
  const campaignId = id('camp')
  const slug = `${slugify(fields.title)}-${campaignId.slice(-4)}`
  const today = new Date().toISOString().slice(0, 10)
  await result(getDb().from('campaigns').insert({
    id: campaignId, slug, title: fields.title, summary: fields.summary, description: fields.summary, story: fields.summary,
    category: fields.category, level: fields.level, location: fields.location, status: fields.status, target: fields.target,
    raised: 0, donors: 0, deadline: fields.deadline, created_at: today, image: '/school-pesa-hero.png',
    gallery: [], video: null, beneficiary_id: null, seo_title: fields.title, seo_description: fields.summary,
    updates: [], owner_email: donorKey(email),
  }), 'create donor campaign')
  await alertDonor(email, { title: 'Campaign created', body: `“${fields.title}” is saved on your account.`, kind: 'campaign', href: '/dashboard/campaigns' })
  refresh()
}

export async function updateDonorCampaign(campaignId: string, input: DonorCampaignInput) {
  const email = await donorEmail()
  const fields = campaignInput(input)
  const updated = await result(getDb().from('campaigns').update({
    title: fields.title, summary: fields.summary, description: fields.summary, story: fields.summary,
    category: fields.category, level: fields.level, location: fields.location, status: fields.status,
    target: fields.target, deadline: fields.deadline, seo_title: fields.title, seo_description: fields.summary,
  }).eq('id', campaignId).ilike('owner_email', donorKey(email)).select('id'), 'update donor campaign')
  if (!updated?.length) throw new Error('You can only edit a campaign you created.')
  refresh()
}

export async function deleteDonorCampaign(campaignId: string) {
  const email = await donorEmail()
  const db = getDb()
  const deleted = await result(db.from('campaigns').delete().eq('id', campaignId).ilike('owner_email', donorKey(email)).select('id'), 'delete donor campaign')
  if (!deleted?.length) throw new Error('You can only remove a campaign you created.')
  refresh()
}

export async function saveCampaignLink(campaignId: string, note: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const existing = await result(db.from('campaign_links').select('hidden').ilike('email', key).eq('campaign_id', campaignId).maybeSingle(), 'check followed campaign')
  await result(db.from('campaign_links').upsert({ email: key, campaign_id: campaignId, note: note.trim(), hidden: false }, { onConflict: 'email,campaign_id' }), 'save followed campaign')
  if (!existing || existing.hidden) {
    const campaign = await result(db.from('campaigns').select('title').eq('id', campaignId).maybeSingle(), 'find followed campaign')
    await alertDonor(email, { title: 'Campaign added', body: campaign ? `You are following “${campaign.title}”.` : 'A campaign was added to your account.', kind: 'campaign', href: '/dashboard/campaigns' })
  }
  refresh()
}

export async function hideCampaignLink(campaignId: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const owned = await result(db.from('campaigns').select('id').eq('id', campaignId).ilike('owner_email', key).maybeSingle(), 'check campaign ownership')
  if (owned) throw new Error('Remove a campaign you created with delete.')
  await result(db.from('campaign_links').upsert({ email: key, campaign_id: campaignId, note: '', hidden: true }, { onConflict: 'email,campaign_id' }), 'hide followed campaign')
  refresh()
}

export async function saveSponsorship(beneficiaryId: string, note: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const existing = await result(db.from('sponsorships').select('hidden').ilike('email', key).eq('beneficiary_id', beneficiaryId).maybeSingle(), 'check learner sponsorship')
  await result(db.from('sponsorships').upsert({ email: key, beneficiary_id: beneficiaryId, note: note.trim(), hidden: false }, { onConflict: 'email,beneficiary_id' }), 'save learner sponsorship')
  if (!existing || existing.hidden) {
    const learner = await result(db.from('beneficiaries').select('display_name').eq('id', beneficiaryId).maybeSingle(), 'find sponsored learner')
    await alertDonor(email, { title: 'Learner added', body: learner ? `You are supporting ${learner.display_name}.` : 'A learner was added to your account.', kind: 'learner', href: '/dashboard/sponsored' })
  }
  refresh()
}

export async function hideSponsorship(beneficiaryId: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const owned = await result(db.from('beneficiaries').select('id').eq('id', beneficiaryId).ilike('owner_email', key).maybeSingle(), 'check learner ownership')
  if (owned) throw new Error('Remove a learner you created with delete.')
  await result(db.from('sponsorships').upsert({ email: key, beneficiary_id: beneficiaryId, note: '', hidden: true }, { onConflict: 'email,beneficiary_id' }), 'hide learner sponsorship')
  refresh()
}

const learnerStatuses: Beneficiary['status'][] = ['active', 'paused', 'completed']

function learnerInput(input: DonorLearnerInput) {
  const displayName = input.displayName.trim()
  if (!displayName) throw new Error('Add a display name.')
  const level = (['Nursery', 'Primary', 'Secondary', 'University'] as string[]).includes(input.level) ? input.level : 'Primary'
  const status = learnerStatuses.includes(input.status) ? input.status : 'active'
  const target = Math.round(Number(input.target))
  if (!Number.isFinite(target) || target < 0) throw new Error('Enter a target of zero or more.')
  return {
    displayName,
    level,
    school: input.school.trim(),
    location: input.location.trim(),
    needs: input.needs.trim(),
    story: input.story.trim(),
    target,
    status,
    publicProfile: input.publicProfile ? 1 : 0,
    publicImage: input.publicImage ? 1 : 0,
    storyVisible: input.storyVisible ? 1 : 0,
  }
}

export async function createDonorLearner(input: DonorLearnerInput) {
  const email = await donorEmail()
  const fields = learnerInput(input)
  await result(getDb().from('beneficiaries').insert({
    id: id('ben'), display_name: fields.displayName, level: fields.level, school: fields.school,
    location: fields.location, story: fields.story, needs: fields.needs, target: fields.target, raised: 0,
    image: '/school-pesa-hero.png', public_profile: Boolean(fields.publicProfile), public_image: Boolean(fields.publicImage),
    story_visible: Boolean(fields.storyVisible), status: fields.status, updates: [], owner_email: donorKey(email),
  }), 'create donor learner')
  await alertDonor(email, { title: 'Learner profile created', body: `${fields.displayName} is saved on your account.`, kind: 'learner', href: '/dashboard/sponsored' })
  refresh()
}

export async function updateDonorLearner(learnerId: string, input: DonorLearnerInput) {
  const email = await donorEmail()
  const fields = learnerInput(input)
  const updated = await result(getDb().from('beneficiaries').update({
    display_name: fields.displayName, level: fields.level, school: fields.school, location: fields.location,
    story: fields.story, needs: fields.needs, target: fields.target, public_profile: Boolean(fields.publicProfile),
    public_image: Boolean(fields.publicImage), story_visible: Boolean(fields.storyVisible), status: fields.status,
  }).eq('id', learnerId).ilike('owner_email', donorKey(email)).select('id'), 'update donor learner')
  if (!updated?.length) throw new Error('You can only edit a learner you created.')
  refresh()
}

export async function deleteDonorLearner(learnerId: string) {
  const email = await donorEmail()
  const db = getDb()
  const deleted = await result(db.from('beneficiaries').delete().eq('id', learnerId).ilike('owner_email', donorKey(email)).select('id'), 'delete donor learner')
  if (!deleted?.length) throw new Error('You can only remove a learner you created.')
  refresh()
}

type UpdateDraft = { title: string; body: string; campaignId?: string; beneficiaryId?: string }

const editableStatuses: UpdateStatus[] = ['draft', 'changes', 'declined']

async function cleanDraft(email: string, input: UpdateDraft) {
  const title = input.title.trim()
  const body = input.body.trim()
  if (!title || !body) throw new Error('Add a title and a note.')
  if (title.length > 140) throw new Error('Keep the title under 140 characters.')
  const campaignId = input.campaignId?.trim() || null
  const beneficiaryId = input.beneficiaryId?.trim() || null
  if (campaignId && !(await donorCampaigns(email)).some((item) => item.id === campaignId)) throw new Error('Choose a campaign linked to your account.')
  if (beneficiaryId && !(await donorChildren(email)).some((item) => item.id === beneficiaryId)) throw new Error('Choose a learner linked to your account.')
  return { title, body, campaignId, beneficiaryId }
}

async function ownedUpdate(email: string, updateId: string) {
  const row = await result(getDb().from('donor_updates').select('status').eq('id', updateId).ilike('email', donorKey(email)).maybeSingle(), 'find donor update') as { status: UpdateStatus } | null
  if (!row) throw new Error('That update is not on your account.')
  return row
}

export async function createDonorUpdate(input: UpdateDraft) {
  const email = await donorEmail()
  const fields = await cleanDraft(email, input)
  await result(getDb().from('donor_updates').insert({
    id: id('du'), email: donorKey(email), title: fields.title, body: fields.body,
    date: new Date().toISOString().slice(0, 10), status: 'draft', campaign_id: fields.campaignId,
    beneficiary_id: fields.beneficiaryId, review_note: '', category: 'Success Stories',
  }), 'create donor update')
  refresh()
}

export async function updateDonorUpdate(updateId: string, input: UpdateDraft) {
  const email = await donorEmail()
  const current = await ownedUpdate(email, updateId)
  if (!editableStatuses.includes(current.status)) throw new Error('This update is with the admin. Withdraw it before editing.')
  const fields = await cleanDraft(email, input)
  const updated = await result(getDb().from('donor_updates').update({
    title: fields.title, body: fields.body, campaign_id: fields.campaignId, beneficiary_id: fields.beneficiaryId,
  }).eq('id', updateId).ilike('email', donorKey(email)).select('id'), 'update donor update')
  if (!updated?.length) throw new Error('That update is not on your account.')
  refresh()
}

export async function submitDonorUpdate(updateId: string) {
  const email = await donorEmail()
  const current = await ownedUpdate(email, updateId)
  if (!editableStatuses.includes(current.status)) throw new Error('This update is already with the admin.')
  const row = await result(getDb().from('donor_updates').select('title, body').eq('id', updateId).ilike('email', donorKey(email)).maybeSingle(), 'read donor update') as { title: string; body: string } | null
  if (!row) throw new Error('That update is not on your account.')
  if (!row.title.trim() || !row.body.trim()) throw new Error('Add a title and a note before sending it for review.')
  const updated = await result(getDb().from('donor_updates').update({
    status: 'submitted', review_note: '', date: new Date().toISOString().slice(0, 10),
  }).eq('id', updateId).ilike('email', donorKey(email)).select('id'), 'submit donor update')
  if (!updated?.length) throw new Error('That update is not on your account.')
  refresh()
}

export async function withdrawDonorUpdate(updateId: string) {
  const email = await donorEmail()
  const current = await ownedUpdate(email, updateId)
  if (current.status !== 'submitted') throw new Error('Only an update that is waiting for review can be withdrawn.')
  const updated = await result(getDb().from('donor_updates').update({ status: 'draft' }).eq('id', updateId).ilike('email', donorKey(email)).select('id'), 'withdraw donor update')
  if (!updated?.length) throw new Error('That update is not on your account.')
  refresh()
}

export async function deleteDonorUpdate(updateId: string) {
  const email = await donorEmail()
  const current = await ownedUpdate(email, updateId)
  if (current.status === 'submitted' || current.status === 'published') throw new Error('Withdraw the review, or ask an admin to unpublish, before removing this update.')
  const deleted = await result(getDb().from('donor_updates').delete().eq('id', updateId).ilike('email', donorKey(email)).select('id'), 'delete donor update')
  if (!deleted?.length) throw new Error('That update is not on your account.')
  refresh()
}

export async function createNotification(input: { title: string; body: string }) {
  const email = await donorEmail()
  if (!input.title.trim()) throw new Error('Add a title.')
  await alertDonor(email, { title: input.title.trim(), body: input.body.trim(), kind: 'reminder', href: '/dashboard/notifications' })
  refresh()
}

export async function markNotificationsRead() {
  const email = await donorEmail()
  await result(getDb().from('notifications').update({ read: true }).ilike('email', donorKey(email)).eq('read', false), 'mark notifications read')
  refresh()
}

export async function setNotificationRead(notificationId: string, read: boolean) {
  const email = await donorEmail()
  const updated = await result(getDb().from('notifications').update({ read }).eq('id', notificationId).ilike('email', donorKey(email)).select('id'), 'update notification')
  if (!updated?.length) throw new Error('That notification is not on your account.')
  refresh()
}

export async function deleteNotification(notificationId: string) {
  const email = await donorEmail()
  const deleted = await result(getDb().from('notifications').delete().eq('id', notificationId).ilike('email', donorKey(email)).select('id'), 'delete notification')
  if (!deleted?.length) throw new Error('That notification is not on your account.')
  refresh()
}

const cadences = new Set<DonorPreferences['updateCadence']>(['instant', 'weekly', 'off'])

export async function saveDonorPreferences(input: DonorPreferences) {
  const email = await donorEmail()
  if (!cadences.has(input.updateCadence)) throw new Error('Choose how often to send campaign updates.')
  const key = donorKey(email)
  const db = getDb()
  await result(db.from('donor_settings').upsert({
    email: key, email_updates: input.updateCadence !== 'off', receipt_emails: input.receiptEmails,
    digest: input.digest, product_news: input.productNews, anonymous_default: input.anonymousDefault,
    public_recognition: input.publicRecognition, update_cadence: input.updateCadence,
  }, { onConflict: 'email' }), 'save donor preferences')
  if (input.productNews) {
    await result(db.from('newsletter').upsert({ id: id('n'), email: key }, { onConflict: 'email', ignoreDuplicates: true }), 'subscribe to newsletter')
  } else {
    await result(db.from('newsletter').delete().ilike('email', key), 'unsubscribe from newsletter')
  }
  refresh()
}

export async function resetDonorPreferences() {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  await result(db.from('donor_settings').delete().ilike('email', key), 'reset donor preferences')
  await result(db.from('newsletter').delete().ilike('email', key), 'reset newsletter preference')
  refresh()
}

export async function exportDonorData() {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const [profile, preferences, donations, campaigns, learners, updates, notifications] = await Promise.all([
    result(db.from('users').select('name, email, phone, role').ilike('email', key).maybeSingle(), 'export donor profile'),
    donorPreferences(email),
    result(db.from('donations').select('id, amount, frequency, date, status, method, transaction_id, support_target, message, anonymous').ilike('email', key).order('date', { ascending: false }), 'export donations'),
    result(db.from('campaign_links').select('campaign_id, note, hidden').ilike('email', key), 'export followed campaigns'),
    result(db.from('sponsorships').select('beneficiary_id, note, hidden').ilike('email', key), 'export sponsored learners'),
    result(db.from('donor_updates').select('id, title, body, date, status, category').ilike('email', key).order('date', { ascending: false }), 'export donor updates'),
    result(db.from('notifications').select('id, title, body, date, read').ilike('email', key).order('date', { ascending: false }), 'export notifications'),
  ])
  return {
    exportedAt: new Date().toISOString(),
    profile, preferences, donations: donations ?? [], campaigns: campaigns ?? [], learners: learners ?? [],
    updates: updates ?? [], notifications: notifications ?? [],
  }
}

export async function deleteDonorAccountData(confirmation: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  if (confirmation.trim().toLowerCase() !== key) throw new Error('Type your email address to confirm.')
  const db = getDb()
  for (const table of ['donor_settings', 'users', 'notifications', 'campaign_links', 'sponsorships', 'donor_updates', 'newsletter']) {
    await result(db.from(table).delete().ilike('email', key), `delete donor data from ${table}`)
  }
  refresh()
}

export async function deleteDonorProfile() {
  const email = await donorEmail()
  await result(getDb().from('users').delete().ilike('email', donorKey(email)), 'delete donor profile')
  refresh()
}
