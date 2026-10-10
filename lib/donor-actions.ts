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
  db.prepare(`INSERT INTO donations (id, donor_name, anonymous, email, phone, amount, frequency, campaign_id, beneficiary_id, support_target, method, transaction_id, date, status, message, created_at)
    VALUES (?, ?, 0, ?, ?, ?, 'one-time', ?, ?, ?, 'Recorded', ?, ?, 'Pending', ?, ?)`).run(
    donationId,
    account?.name || 'Donor',
    email,
    account?.phone || '',
    amount,
    input.campaignId || null,
    input.beneficiaryId || null,
    support,
    reference,
    today,
    input.message.trim(),
    new Date().toISOString(),
  )
  db.prepare('INSERT INTO transactions (id, donation_id, provider, reference, amount, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id('pt'), donationId, 'Recorded', reference, amount, 'Pending', today,
  )
  alertDonor(email, { title: 'Gift recorded', body: `${formatUGX(amount)} is saved as pending. Reference ${reference}.`, kind: 'gift', href: '/dashboard/donations' })
  refresh()
}

export async function updateDonationMessage(donationId: string, message: string) {
  const email = await donorEmail()
  if (!ownedDonation(email, donationId)) throw new Error('That gift is not on your account.')
  getDb().prepare('UPDATE donations SET message = ? WHERE id = ? AND lower(email) = ?').run(message.trim(), donationId, donorKey(email))
  refresh()
}

export async function deleteDonationRecord(donationId: string) {
  const email = await donorEmail()
  if (!ownedDonation(email, donationId)) throw new Error('That gift is not on your account.')
  const db = getDb()
  db.prepare('DELETE FROM transactions WHERE donation_id = ?').run(donationId)
  db.prepare('DELETE FROM donations WHERE id = ? AND lower(email) = ?').run(donationId, donorKey(email))
  refresh()
}

export async function retryDonation(donationId: string) {
  const email = await donorEmail()
  const donation = ownedDonation(email, donationId)
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
  getDb().prepare(`INSERT INTO campaigns (id, slug, title, summary, description, story, category, level, location, status, target, raised, donors, deadline, created_at, image, gallery, video, beneficiary_id, seo_title, seo_description, updates, owner_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, '/school-pesa-hero.png', '[]', NULL, NULL, ?, ?, '[]', ?)`).run(
    campaignId, slug, fields.title, fields.summary, fields.summary, fields.summary, fields.category, fields.level, fields.location, fields.status, fields.target, fields.deadline, today, fields.title, fields.summary, donorKey(email),
  )
  alertDonor(email, { title: 'Campaign created', body: `“${fields.title}” is saved on your account.`, kind: 'campaign', href: '/dashboard/campaigns' })
  refresh()
}

export async function updateDonorCampaign(campaignId: string, input: DonorCampaignInput) {
  const email = await donorEmail()
  const fields = campaignInput(input)
  const result = getDb().prepare(`UPDATE campaigns SET title = ?, summary = ?, description = ?, story = ?, category = ?, level = ?, location = ?, status = ?, target = ?, deadline = ?, seo_title = ?, seo_description = ? WHERE id = ? AND lower(owner_email) = ?`).run(
    fields.title, fields.summary, fields.summary, fields.summary, fields.category, fields.level, fields.location, fields.status, fields.target, fields.deadline, fields.title, fields.summary, campaignId, donorKey(email),
  )
  if (Number(result.changes) === 0) throw new Error('You can only edit a campaign you created.')
  refresh()
}

export async function deleteDonorCampaign(campaignId: string) {
  const email = await donorEmail()
  const db = getDb()
  const result = db.prepare('DELETE FROM campaigns WHERE id = ? AND lower(owner_email) = ?').run(campaignId, donorKey(email))
  if (Number(result.changes) === 0) throw new Error('You can only remove a campaign you created.')
  db.prepare('DELETE FROM campaign_links WHERE campaign_id = ?').run(campaignId)
  refresh()
}

export async function saveCampaignLink(campaignId: string, note: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const existing = db.prepare('SELECT hidden FROM campaign_links WHERE lower(email) = ? AND campaign_id = ?').get(key, campaignId) as { hidden: number } | undefined
  db.prepare(`INSERT INTO campaign_links (email, campaign_id, note, hidden) VALUES (?, ?, ?, 0)
    ON CONFLICT(email, campaign_id) DO UPDATE SET note = excluded.note, hidden = 0`).run(key, campaignId, note.trim())
  if (!existing || existing.hidden) {
    const campaign = db.prepare('SELECT title FROM campaigns WHERE id = ?').get(campaignId) as { title: string } | undefined
    alertDonor(email, { title: 'Campaign added', body: campaign ? `You are following “${campaign.title}”.` : 'A campaign was added to your account.', kind: 'campaign', href: '/dashboard/campaigns' })
  }
  refresh()
}

export async function hideCampaignLink(campaignId: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const owned = db.prepare('SELECT id FROM campaigns WHERE id = ? AND lower(owner_email) = ?').get(campaignId, key)
  if (owned) throw new Error('Remove a campaign you created with delete.')
  db.prepare(`INSERT INTO campaign_links (email, campaign_id, note, hidden) VALUES (?, ?, '', 1)
    ON CONFLICT(email, campaign_id) DO UPDATE SET hidden = 1`).run(key, campaignId)
  refresh()
}

export async function saveSponsorship(beneficiaryId: string, note: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const existing = db.prepare('SELECT hidden FROM sponsorships WHERE lower(email) = ? AND beneficiary_id = ?').get(key, beneficiaryId) as { hidden: number } | undefined
  db.prepare(`INSERT INTO sponsorships (email, beneficiary_id, note, hidden) VALUES (?, ?, ?, 0)
    ON CONFLICT(email, beneficiary_id) DO UPDATE SET note = excluded.note, hidden = 0`).run(key, beneficiaryId, note.trim())
  if (!existing || existing.hidden) {
    const learner = db.prepare('SELECT display_name FROM beneficiaries WHERE id = ?').get(beneficiaryId) as { display_name: string } | undefined
    alertDonor(email, { title: 'Learner added', body: learner ? `You are supporting ${learner.display_name}.` : 'A learner was added to your account.', kind: 'learner', href: '/dashboard/sponsored' })
  }
  refresh()
}

export async function hideSponsorship(beneficiaryId: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  const owned = db.prepare('SELECT id FROM beneficiaries WHERE id = ? AND lower(owner_email) = ?').get(beneficiaryId, key)
  if (owned) throw new Error('Remove a learner you created with delete.')
  db.prepare(`INSERT INTO sponsorships (email, beneficiary_id, note, hidden) VALUES (?, ?, '', 1)
    ON CONFLICT(email, beneficiary_id) DO UPDATE SET hidden = 1`).run(key, beneficiaryId)
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
  getDb().prepare(`INSERT INTO beneficiaries (id, display_name, level, school, location, story, needs, target, raised, image, public_profile, public_image, story_visible, status, updates, owner_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '/school-pesa-hero.png', ?, ?, ?, ?, '[]', ?)`).run(
    id('ben'), fields.displayName, fields.level, fields.school, fields.location, fields.story, fields.needs, fields.target, fields.publicProfile, fields.publicImage, fields.storyVisible, fields.status, donorKey(email),
  )
  alertDonor(email, { title: 'Learner profile created', body: `${fields.displayName} is saved on your account.`, kind: 'learner', href: '/dashboard/sponsored' })
  refresh()
}

export async function updateDonorLearner(learnerId: string, input: DonorLearnerInput) {
  const email = await donorEmail()
  const fields = learnerInput(input)
  const result = getDb().prepare(`UPDATE beneficiaries SET display_name = ?, level = ?, school = ?, location = ?, story = ?, needs = ?, target = ?, public_profile = ?, public_image = ?, story_visible = ?, status = ? WHERE id = ? AND lower(owner_email) = ?`).run(
    fields.displayName, fields.level, fields.school, fields.location, fields.story, fields.needs, fields.target, fields.publicProfile, fields.publicImage, fields.storyVisible, fields.status, learnerId, donorKey(email),
  )
  if (Number(result.changes) === 0) throw new Error('You can only edit a learner you created.')
  refresh()
}

export async function deleteDonorLearner(learnerId: string) {
  const email = await donorEmail()
  const db = getDb()
  const result = db.prepare('DELETE FROM beneficiaries WHERE id = ? AND lower(owner_email) = ?').run(learnerId, donorKey(email))
  if (Number(result.changes) === 0) throw new Error('You can only remove a learner you created.')
  db.prepare('DELETE FROM sponsorships WHERE beneficiary_id = ?').run(learnerId)
  refresh()
}

type UpdateDraft = { title: string; body: string; campaignId?: string; beneficiaryId?: string }

const editableStatuses: UpdateStatus[] = ['draft', 'changes', 'declined']

function cleanDraft(email: string, input: UpdateDraft) {
  const title = input.title.trim()
  const body = input.body.trim()
  if (!title || !body) throw new Error('Add a title and a note.')
  if (title.length > 140) throw new Error('Keep the title under 140 characters.')
  const campaignId = input.campaignId?.trim() || null
  const beneficiaryId = input.beneficiaryId?.trim() || null
  if (campaignId && !donorCampaigns(email).some((item) => item.id === campaignId)) throw new Error('Choose a campaign linked to your account.')
  if (beneficiaryId && !donorChildren(email).some((item) => item.id === beneficiaryId)) throw new Error('Choose a learner linked to your account.')
  return { title, body, campaignId, beneficiaryId }
}

function ownedUpdate(email: string, updateId: string) {
  const row = getDb().prepare('SELECT status FROM donor_updates WHERE id = ? AND lower(email) = ?').get(updateId, donorKey(email)) as { status: UpdateStatus } | undefined
  if (!row) throw new Error('That update is not on your account.')
  return row
}

export async function createDonorUpdate(input: UpdateDraft) {
  const email = await donorEmail()
  const fields = cleanDraft(email, input)
  getDb().prepare(`INSERT INTO donor_updates (id, email, title, body, date, status, campaign_id, beneficiary_id, review_note, category)
    VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, '', 'Success Stories')`).run(
    id('du'), donorKey(email), fields.title, fields.body, new Date().toISOString().slice(0, 10), fields.campaignId, fields.beneficiaryId,
  )
  refresh()
}

export async function updateDonorUpdate(updateId: string, input: UpdateDraft) {
  const email = await donorEmail()
  const current = ownedUpdate(email, updateId)
  if (!editableStatuses.includes(current.status)) throw new Error('This update is with the admin. Withdraw it before editing.')
  const fields = cleanDraft(email, input)
  getDb().prepare('UPDATE donor_updates SET title = ?, body = ?, campaign_id = ?, beneficiary_id = ? WHERE id = ? AND lower(email) = ?').run(
    fields.title, fields.body, fields.campaignId, fields.beneficiaryId, updateId, donorKey(email),
  )
  refresh()
}

export async function submitDonorUpdate(updateId: string) {
  const email = await donorEmail()
  const current = ownedUpdate(email, updateId)
  if (!editableStatuses.includes(current.status)) throw new Error('This update is already with the admin.')
  const row = getDb().prepare('SELECT title, body FROM donor_updates WHERE id = ?').get(updateId) as { title: string; body: string }
  if (!row.title.trim() || !row.body.trim()) throw new Error('Add a title and a note before sending it for review.')
  getDb().prepare("UPDATE donor_updates SET status = 'submitted', review_note = '', date = ? WHERE id = ?").run(new Date().toISOString().slice(0, 10), updateId)
  refresh()
}

export async function withdrawDonorUpdate(updateId: string) {
  const email = await donorEmail()
  const current = ownedUpdate(email, updateId)
  if (current.status !== 'submitted') throw new Error('Only an update that is waiting for review can be withdrawn.')
  getDb().prepare("UPDATE donor_updates SET status = 'draft' WHERE id = ? AND lower(email) = ?").run(updateId, donorKey(email))
  refresh()
}

export async function deleteDonorUpdate(updateId: string) {
  const email = await donorEmail()
  const current = ownedUpdate(email, updateId)
  if (current.status === 'submitted' || current.status === 'published') throw new Error('Withdraw the review, or ask an admin to unpublish, before removing this update.')
  getDb().prepare('DELETE FROM donor_updates WHERE id = ? AND lower(email) = ?').run(updateId, donorKey(email))
  refresh()
}

export async function createNotification(input: { title: string; body: string }) {
  const email = await donorEmail()
  if (!input.title.trim()) throw new Error('Add a title.')
  alertDonor(email, { title: input.title.trim(), body: input.body.trim(), kind: 'reminder', href: '/dashboard/notifications' })
  refresh()
}

export async function markNotificationsRead() {
  const email = await donorEmail()
  getDb().prepare('UPDATE notifications SET read = 1 WHERE lower(email) = ? AND read = 0').run(donorKey(email))
  refresh()
}

export async function setNotificationRead(notificationId: string, read: boolean) {
  const email = await donorEmail()
  getDb().prepare('UPDATE notifications SET read = ? WHERE id = ? AND lower(email) = ?').run(read ? 1 : 0, notificationId, donorKey(email))
  refresh()
}

export async function deleteNotification(notificationId: string) {
  const email = await donorEmail()
  getDb().prepare('DELETE FROM notifications WHERE id = ? AND lower(email) = ?').run(notificationId, donorKey(email))
  refresh()
}

const cadences = new Set<DonorPreferences['updateCadence']>(['instant', 'weekly', 'off'])

export async function saveDonorPreferences(input: DonorPreferences) {
  const email = await donorEmail()
  if (!cadences.has(input.updateCadence)) throw new Error('Choose how often to send campaign updates.')
  const key = donorKey(email)
  const db = getDb()
  db.prepare(`INSERT INTO donor_settings (email, email_updates, receipt_emails, digest, product_news, anonymous_default, public_recognition, update_cadence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      email_updates = excluded.email_updates,
      receipt_emails = excluded.receipt_emails,
      digest = excluded.digest,
      product_news = excluded.product_news,
      anonymous_default = excluded.anonymous_default,
      public_recognition = excluded.public_recognition,
      update_cadence = excluded.update_cadence`).run(
    key,
    input.updateCadence === 'off' ? 0 : 1,
    input.receiptEmails ? 1 : 0,
    input.digest ? 1 : 0,
    input.productNews ? 1 : 0,
    input.anonymousDefault ? 1 : 0,
    input.publicRecognition ? 1 : 0,
    input.updateCadence,
  )
  if (input.productNews) {
    db.prepare('INSERT OR IGNORE INTO newsletter (id, email, created_at) VALUES (?, ?, ?)').run(id('n'), key, new Date().toISOString())
  } else {
    db.prepare('DELETE FROM newsletter WHERE lower(email) = ?').run(key)
  }
  refresh()
}

export async function resetDonorPreferences() {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  db.prepare('DELETE FROM donor_settings WHERE lower(email) = ?').run(key)
  db.prepare('DELETE FROM newsletter WHERE lower(email) = ?').run(key)
  refresh()
}

export async function exportDonorData() {
  const email = await donorEmail()
  const key = donorKey(email)
  const db = getDb()
  return {
    exportedAt: new Date().toISOString(),
    profile: db.prepare('SELECT name, email, phone, role FROM users WHERE lower(email) = ?').get(key) ?? null,
    preferences: donorPreferences(email),
    donations: db.prepare('SELECT id, amount, frequency, date, status, method, transaction_id, support_target, message, anonymous FROM donations WHERE lower(email) = ? ORDER BY date DESC').all(key),
    campaigns: db.prepare('SELECT campaign_id, note, hidden FROM campaign_links WHERE lower(email) = ?').all(key),
    learners: db.prepare('SELECT beneficiary_id, note, hidden FROM sponsorships WHERE lower(email) = ?').all(key),
    updates: db.prepare('SELECT id, title, body, date, status, category FROM donor_updates WHERE lower(email) = ? ORDER BY date DESC').all(key),
    notifications: db.prepare('SELECT id, title, body, date, read FROM notifications WHERE lower(email) = ? ORDER BY date DESC').all(key),
  }
}

export async function deleteDonorAccountData(confirmation: string) {
  const email = await donorEmail()
  const key = donorKey(email)
  if (confirmation.trim().toLowerCase() !== key) throw new Error('Type your email address to confirm.')
  const db = getDb()
  for (const statement of [
    'DELETE FROM donor_settings WHERE lower(email) = ?',
    'DELETE FROM users WHERE lower(email) = ?',
    'DELETE FROM notifications WHERE lower(email) = ?',
    'DELETE FROM campaign_links WHERE lower(email) = ?',
    'DELETE FROM sponsorships WHERE lower(email) = ?',
    'DELETE FROM donor_updates WHERE lower(email) = ?',
    'DELETE FROM newsletter WHERE lower(email) = ?',
  ]) {
    db.prepare(statement).run(key)
  }
  refresh()
}

export async function deleteDonorProfile() {
  const email = await donorEmail()
  getDb().prepare('DELETE FROM users WHERE lower(email) = ?').run(donorKey(email))
  refresh()
}
