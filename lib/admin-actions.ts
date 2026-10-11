'use server'

import { revalidatePath } from 'next/cache'
import { getDb, syncCampaignImpact } from '@/lib/db'
import { formatUGX } from '@/lib/format'
import { alertDonor, alertFollowers } from '@/lib/notify'
import { assertAdmin } from '@/lib/supabase/session'
import type { CampaignStatus, Expense, Story, Volunteer } from '@/lib/types'

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id('item')
}

async function result<T>(operation: PromiseLike<{ data: T; error: { message: string } | null }>, context: string): Promise<T> {
  const { data, error } = await operation
  if (error) throw new Error(`Could not ${context}: ${error.message}`)
  return data
}

async function audit(user: string, action: string, resource: string, details: string) {
  const now = new Date()
  await result(getDb().from('audit_logs').insert({
    id: id('a'), user, action, resource, date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), details,
  }), 'write audit log')
}

function touch() {
  for (const path of ['/admin', '/admin/campaigns', '/admin/beneficiaries', '/admin/donations', '/admin/stories', '/admin/gallery', '/admin/finance', '/admin/people', '/admin/users', '/admin/content', '/admin/settings', '/admin/reports', '/admin/audit-logs', '/admin/updates', '/campaigns', '/stories', '/gallery', '/news', '/events', '/sponsor', '/impact', '/dashboard', '/dashboard/donations', '/dashboard/receipts', '/dashboard/updates', '/dashboard/notifications']) {
    revalidatePath(path)
  }
}

function missing(rows: unknown[] | null, label: string) {
  if (!rows?.length) throw new Error(`${label} was not found.`)
}

function readable(error: unknown, fallback: string): never {
  const message = error instanceof Error ? error.message : fallback
  if (/UNIQUE/i.test(message)) throw new Error('A record with that name or address already exists.')
  throw error instanceof Error ? error : new Error(fallback)
}

type GiftRow = { id: string; transaction_id: string; status: string }

async function setDonationStatus(reference: string, status: string) {
  const resultStatus = await result(
    getDb().rpc('apply_payment_status', { p_reference: reference, p_status: status }),
    'apply donation status',
  )
  if (resultStatus === 'missing') throw new Error('Gift was not found.')
}

export async function updateCampaign(campaignId: string, input: {
  title: string
  slug: string
  summary: string
  description: string
  category: string
  level: string
  location: string
  target: number
  deadline: string
  createdAt?: string
  image?: string
  gallery?: string
  video?: string
  seoTitle: string
  seoDescription: string
  status: CampaignStatus
  beneficiaryId?: string
}) {
  await assertAdmin()
  const title = input.title.trim()
  if (!title) throw new Error('Add a campaign title.')
  const target = Math.round(Number(input.target))
  if (!Number.isFinite(target) || target < 0) throw new Error('Enter a target of zero or more.')
  if (!input.deadline) throw new Error('Choose an end date.')
  const gallery = JSON.stringify((input.gallery ?? '').split(/[\n,]/).map((item) => item.trim()).filter(Boolean))
  try {
    const updated = await result(getDb().from('campaigns').update({
      slug: slugify(input.slug || title), title, summary: input.summary.trim(), description: input.description.trim(),
      story: input.description.trim(), category: input.category.trim() || 'School Fees', level: input.level,
      location: input.location.trim(), status: input.status, target, deadline: input.deadline,
      created_at: input.createdAt || new Date().toISOString().slice(0, 10), image: input.image?.trim() || '/school-pesa-hero.png',
      gallery: JSON.parse(gallery), video: input.video?.trim() || null, beneficiary_id: input.beneficiaryId || null,
      seo_title: input.seoTitle.trim() || title, seo_description: input.seoDescription.trim() || input.summary.trim(),
    }).eq('id', campaignId).select('id'), 'update campaign')
    missing(updated, 'Campaign')
  } catch (error) {
    readable(error, 'The campaign could not be updated.')
  }
  await syncCampaignImpact()
  await audit('Campaign Manager', 'updated', 'Campaign', `Updated campaign "${title}"`)
  revalidatePath('/campaigns/[slug]', 'page')
  touch()
}

export async function deleteCampaign(campaignId: string) {
  await assertAdmin()
  const db = getDb()
  const existing = await result(db.from('campaigns').select('id').eq('id', campaignId).maybeSingle(), 'find campaign')
  if (!existing) throw new Error('Campaign was not found.')
  for (const table of ['donations', 'stories', 'expenses', 'gallery']) {
    await result(db.from(table).update({ campaign_id: null }).eq('campaign_id', campaignId), `unlink campaign from ${table}`)
  }
  await result(db.from('campaign_links').delete().eq('campaign_id', campaignId), 'delete campaign links')
  const deleted = await result(db.from('campaigns').delete().eq('id', campaignId).select('id'), 'delete campaign')
  missing(deleted, 'Campaign')
  await syncCampaignImpact()
  await audit('Campaign Manager', 'deleted', 'Campaign', `Removed campaign ${campaignId}`)
  revalidatePath('/campaigns/[slug]', 'page')
  touch()
}

const learnerLevels = new Set(['Nursery', 'Primary', 'Secondary', 'University'])
const learnerStatuses = new Set(['active', 'paused', 'completed'])

export async function saveBeneficiary(input: {
  id?: string
  displayName: string
  level: string
  school: string
  location: string
  needs: string
  story: string
  target: number
  status: string
  image?: string
  publicProfile: boolean
  publicImage: boolean
  storyVisible: boolean
}) {
  await assertAdmin()
  const name = input.displayName.trim()
  if (!name) throw new Error('Enter the learner’s name.')
  if (!learnerLevels.has(input.level)) throw new Error('Choose an education level.')
  if (!learnerStatuses.has(input.status)) throw new Error('Choose a status.')
  if (!Number.isFinite(input.target) || input.target < 0) throw new Error('Enter a target of zero or more.')
  const story = input.story.trim() || input.needs.trim()
  const profile = input.publicProfile ? 1 : 0
  const imageFlag = input.publicImage ? 1 : 0
  const visible = input.storyVisible ? 1 : 0
  const db = getDb()
  const photo = input.image?.trim()
  if (input.id) {
    const existing = await result(db.from('beneficiaries').select('image').eq('id', input.id).maybeSingle(), 'find learner')
    if (!existing) throw new Error('Learner was not found.')
    const updated = await result(db.from('beneficiaries').update({
      display_name: name, level: input.level, school: input.school.trim(), location: input.location.trim(),
      story, needs: input.needs.trim(), target: input.target, image: photo || existing.image,
      public_profile: Boolean(profile), public_image: Boolean(imageFlag), story_visible: Boolean(visible), status: input.status,
    }).eq('id', input.id).select('id'), 'update learner')
    missing(updated, 'Learner')
    await audit('Campaign Manager', 'updated', 'Beneficiary', `Updated learner "${name}"`)
  } else {
    await result(db.from('beneficiaries').insert({
      id: id('ben'), display_name: name, level: input.level, school: input.school.trim(), location: input.location.trim(),
      story, needs: input.needs.trim(), target: input.target, raised: 0, image: photo || '/school-pesa-hero.png',
      public_profile: Boolean(profile), public_image: Boolean(imageFlag), story_visible: Boolean(visible), status: input.status, updates: [],
    }), 'create learner')
    await audit('Campaign Manager', 'created', 'Beneficiary', `Added learner "${name}"`)
  }
  revalidatePath('/sponsor/[id]', 'page')
  revalidatePath('/dashboard/sponsored')
  touch()
}

export async function deleteBeneficiary(beneficiaryId: string) {
  await assertAdmin()
  const db = getDb()
  const existing = await result(db.from('beneficiaries').select('display_name').eq('id', beneficiaryId).maybeSingle(), 'find learner')
  if (!existing) throw new Error('Learner was not found.')
  for (const table of ['donations', 'stories', 'campaigns', 'donor_updates']) {
    await result(db.from(table).update({ beneficiary_id: null }).eq('beneficiary_id', beneficiaryId), `unlink learner from ${table}`)
  }
  await result(db.from('sponsorships').delete().eq('beneficiary_id', beneficiaryId), 'delete learner sponsorships')
  const deleted = await result(db.from('beneficiaries').delete().eq('id', beneficiaryId).select('id'), 'delete learner')
  missing(deleted, 'Learner')
  await audit('Campaign Manager', 'deleted', 'Beneficiary', `Removed learner "${existing.display_name}"`)
  revalidatePath('/sponsor/[id]', 'page')
  revalidatePath('/dashboard/sponsored')
  touch()
}

type GiftInput = {
  donorName: string
  email: string
  phone: string
  amount: number
  method: string
  date: string
  campaignId?: string
  beneficiaryId?: string
  message: string
}

const giftMethods = ['Bank transfer', 'Cash', 'Mobile money', 'Cheque']

async function giftFields(input: GiftInput) {
  const donorName = input.donorName.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const amount = Math.round(Number(input.amount))
  const date = input.date.trim()
  const method = input.method.trim()
  if (!donorName) throw new Error('Add the donor name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  if (!Number.isFinite(amount) || amount < 500) throw new Error('Enter an amount of at least 500 UGX.')
  if (!giftMethods.includes(method)) throw new Error('Choose how the gift was received.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose the date the gift was received.')
  const campaignId = input.campaignId?.trim() || null
  const beneficiaryId = input.beneficiaryId?.trim() || null
  const db = getDb()
  if (campaignId && !await result(db.from('campaigns').select('id').eq('id', campaignId).maybeSingle(), 'check campaign')) throw new Error('That campaign is not on file.')
  if (beneficiaryId && !await result(db.from('beneficiaries').select('id').eq('id', beneficiaryId).maybeSingle(), 'check learner')) throw new Error('That learner is not on file.')
  const support = beneficiaryId ? 'child' : campaignId ? 'campaign' : 'general'
  return { donorName, email, phone, amount, date, method, campaignId, beneficiaryId, support, message: input.message.trim() }
}

export async function createAdminDonation(input: GiftInput) {
  await assertAdmin()
  const fields = await giftFields(input)
  const donationId = id('d')
  const reference = `ADM-${Date.now().toString(36).toUpperCase()}`
  await result(getDb().from('donations').insert({
    id: donationId, donor_name: fields.donorName, anonymous: false, email: fields.email, phone: fields.phone,
    amount: fields.amount, frequency: 'one-time', campaign_id: fields.campaignId, beneficiary_id: fields.beneficiaryId,
    support_target: fields.support, method: fields.method, transaction_id: reference, date: fields.date,
    status: 'Pending', message: fields.message || null, created_at: new Date().toISOString(),
  }), 'record donation')
  await result(getDb().from('transactions').insert({
    id: id('pt'), donation_id: donationId, provider: fields.method, reference, amount: fields.amount,
    status: 'Pending', date: fields.date,
  }), 'record donation transaction')
  await setDonationStatus(reference, 'Successful')
  await alertDonor(fields.email, { title: 'Gift confirmed', body: `${formatUGX(fields.amount)} is confirmed. Reference ${reference}.`, kind: 'gift', href: '/dashboard/receipts' })
  await audit('Finance Admin', 'created', 'Donation', `Recorded gift ${reference}`)
  touch()
}

export async function updateAdminDonation(donationId: string, input: GiftInput) {
  await assertAdmin()
  const fields = await giftFields(input)
  const db = getDb()
  const row = await result(db.from('donations').select('id, transaction_id, status').eq('id', donationId).maybeSingle(), 'find donation') as GiftRow | null
  if (!row) throw new Error('Gift was not found.')
  if (row.status === 'Successful') await setDonationStatus(row.transaction_id, 'Cancelled')
  const updated = await result(db.from('donations').update({
    donor_name: fields.donorName, email: fields.email, phone: fields.phone, amount: fields.amount,
    method: fields.method, date: fields.date, campaign_id: fields.campaignId, beneficiary_id: fields.beneficiaryId,
    support_target: fields.support, message: fields.message || null,
  }).eq('id', donationId).select('id'), 'update donation')
  missing(updated, 'Gift')
  await result(db.from('transactions').update({ provider: fields.method, amount: fields.amount, date: fields.date }).eq('donation_id', donationId), 'update donation transactions')
  if (row.status === 'Successful') await setDonationStatus(row.transaction_id, 'Successful')
  await audit('Finance Admin', 'updated', 'Donation', `Updated gift for ${fields.donorName}`)
  touch()
}

export async function deleteAdminDonation(donationId: string) {
  await assertAdmin()
  const db = getDb()
  const row = await result(db.from('donations').select('id, transaction_id, status').eq('id', donationId).maybeSingle(), 'find donation') as GiftRow | null
  if (!row) throw new Error('Gift was not found.')
  if (row.status === 'Successful') await setDonationStatus(row.transaction_id, 'Cancelled')
  await result(db.from('transactions').delete().eq('donation_id', donationId), 'delete donation transactions')
  const deleted = await result(db.from('donations').delete().eq('id', donationId).select('id'), 'delete donation')
  missing(deleted, 'Gift')
  await audit('Finance Admin', 'deleted', 'Donation', `Removed gift ${donationId}`)
  touch()
}

export async function updateStory(storyId: string, input: { title: string; body: string; category: string; status: Story['status'] }) {
  await assertAdmin()
  const updated = await result(getDb().from('stories').update({
    title: input.title, excerpt: input.body.slice(0, 140), body: input.body, category: input.category, status: input.status,
  }).eq('id', storyId).select('id'), 'update story')
  missing(updated, 'Story')
  await audit('Content Manager', 'updated', 'Story', `Updated story "${input.title}"`)
  touch()
}

export async function deleteStory(storyId: string) {
  await assertAdmin()
  const db = getDb()
  const existing = await result(db.from('stories').select('title').eq('id', storyId).maybeSingle(), 'find story')
  if (!existing) throw new Error('Story was not found.')
  await result(db.from('gallery').update({ story_id: null }).eq('story_id', storyId), 'unlink story gallery photos')
  const deleted = await result(db.from('stories').delete().eq('id', storyId).select('id'), 'delete story')
  missing(deleted, 'Story')
  await audit('Content Manager', 'deleted', 'Story', `Removed story "${existing.title}"`)
  revalidatePath('/stories/[slug]', 'page')
  touch()
}

const storyStatuses = new Set(['draft', 'published'])
const storyCategories = ['Success Stories', 'Scholarships', 'School Requirements', 'Community', 'Students', 'Events']

export async function saveStory(input: {
  id?: string
  title: string
  body: string
  excerpt: string
  category: string
  author: string
  image: string
  status: string
  campaignId?: string
  beneficiaryId?: string
}) {
  await assertAdmin()
  const title = input.title.trim()
  const body = input.body.replace(/\r\n/g, '\n').trim()
  if (!title) throw new Error('Add a title.')
  if (!body) throw new Error('Write the story.')
  if (!storyStatuses.has(input.status)) throw new Error('Choose a status.')
  const category = storyCategories.includes(input.category) ? input.category : 'Success Stories'
  const author = input.author.trim() || 'School Pesa'
  const image = input.image.trim() || '/school-pesa-hero.png'
  if (!image.startsWith('/')) throw new Error('Use a photo already on the site, starting with /.')
  const plain = body.replace(/\*\*([^*\n]+)\*\*/g, '$1').replace(/\*([^*\n]+)\*/g, '$1').replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g, '$1').replace(/^##\s+/gm, '').replace(/^>\s+/gm, '').replace(/^- /gm, '').replace(/\s+/g, ' ').trim()
  const excerpt = input.excerpt.trim() || plain.slice(0, 140)
  const db = getDb()
  const campaignId = input.campaignId?.trim() || null
  const beneficiaryId = input.beneficiaryId?.trim() || null
  if (campaignId && !await result(db.from('campaigns').select('id').eq('id', campaignId).maybeSingle(), 'check campaign')) throw new Error('That campaign is not on file.')
  if (beneficiaryId && !await result(db.from('beneficiaries').select('id').eq('id', beneficiaryId).maybeSingle(), 'check learner')) throw new Error('That learner is not on file.')
  const base = slugify(title)
  let slug = base
  let suffix = 2
  while (await result(db.from('stories').select('id').eq('slug', slug).neq('id', input.id ?? '').maybeSingle(), 'check story address')) slug = `${base}-${suffix++}`
  if (input.id) {
    const updated = await result(db.from('stories').update({
      slug, title, excerpt, body, category, author, image, campaign_id: campaignId, beneficiary_id: beneficiaryId, status: input.status,
    }).eq('id', input.id).select('id'), 'update story')
    missing(updated, 'Story')
    await audit('Content Manager', 'updated', 'Story', `Updated story "${title}"`)
  } else {
    const today = new Date().toISOString().slice(0, 10)
    await result(db.from('stories').insert({
      id: id('st'), slug, title, excerpt, body, category, author, date: today, image, gallery: [],
      campaign_id: campaignId, beneficiary_id: beneficiaryId, status: input.status, views: 0,
    }), 'create story')
    await audit('Content Manager', 'created', 'Story', `Saved story "${title}"`)
  }
  revalidatePath('/stories/[slug]', 'page')
  touch()
}

export async function setStoryStatus(storyId: string, status: string) {
  await assertAdmin()
  if (!storyStatuses.has(status)) throw new Error('Choose a status.')
  const existing = await result(getDb().from('stories').select('title').eq('id', storyId).maybeSingle(), 'find story')
  if (!existing) throw new Error('Story was not found.')
  const updated = await result(getDb().from('stories').update({ status }).eq('id', storyId).select('id'), 'update story status')
  missing(updated, 'Story')
  await audit('Content Manager', status === 'published' ? 'published' : 'unpublished', 'Story', `${status === 'published' ? 'Published' : 'Unpublished'} "${existing.title}"`)
  revalidatePath('/stories/[slug]', 'page')
  touch()
}

export async function updateGalleryItem(itemId: string, input: { alt: string; caption: string; category: string }) {
  await assertAdmin()
  const updated = await result(getDb().from('gallery').update({ alt: input.alt, caption: input.caption, category: input.category }).eq('id', itemId).select('id'), 'update gallery photo')
  missing(updated, 'Photo')
  await audit('Content Manager', 'updated', 'Gallery', `Updated photo ${itemId}`)
  touch()
}

const expenseStatuses = new Set(['recorded', 'approved', 'paid'])

export async function saveExpense(input: Omit<Expense, 'id'> & { id?: string }) {
  await assertAdmin()
  const description = input.description.trim()
  if (!description) throw new Error('Describe the expense.')
  const amount = Math.round(Number(input.amount))
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Enter an amount of zero or more.')
  const date = input.date.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose the date of the expense.')
  if (!expenseStatuses.has(input.status)) throw new Error('Choose a status.')
  const category = input.category.trim() || 'General'
  const supplier = input.supplier.trim()
  const receipt = input.receipt.trim() || `RCP-${Date.now().toString(36).toUpperCase()}`
  const campaignId = input.campaignId?.trim() || null
  const db = getDb()
  if (campaignId && !await result(db.from('campaigns').select('id').eq('id', campaignId).maybeSingle(), 'check campaign')) throw new Error('That campaign is not on file.')
  if (input.id) {
    const updated = await result(db.from('expenses').update({
      date, category, campaign_id: campaignId, description, amount, supplier, receipt, status: input.status,
    }).eq('id', input.id).select('id'), 'update expense')
    missing(updated, 'Expense')
    await audit('Finance Admin', 'updated', 'Expense', `Updated ${receipt}`)
  } else {
    await result(db.from('expenses').insert({
      id: id('x'), date, category, campaign_id: campaignId, description, amount, supplier, receipt, status: input.status,
    }), 'create expense')
    await audit('Finance Admin', 'recorded', 'Expense', `Recorded ${receipt}`)
  }
  touch()
}

export async function updateExpense(expenseId: string, input: Omit<Expense, 'id'>) {
  await assertAdmin()
  const updated = await result(getDb().from('expenses').update({
    date: input.date, category: input.category, campaign_id: input.campaignId ?? null,
    description: input.description, amount: input.amount, supplier: input.supplier,
    receipt: input.receipt, status: input.status,
  }).eq('id', expenseId).select('id'), 'update expense')
  missing(updated, 'Expense')
  await audit('Finance Admin', 'updated', 'Expense', `Updated ${input.receipt || expenseId}`)
  touch()
}

export async function deleteExpense(expenseId: string) {
  await assertAdmin()
  const deleted = await result(getDb().from('expenses').delete().eq('id', expenseId).select('id'), 'delete expense')
  missing(deleted, 'Expense')
  await audit('Finance Admin', 'deleted', 'Expense', `Removed expense ${expenseId}`)
  touch()
}

export async function savePartner(input: { id?: string; name: string; logoUrl?: string }) {
  await assertAdmin()
  const db = getDb()
  if (input.id) {
    const updated = await result(db.from('partners').update({ name: input.name, logo_url: input.logoUrl || null }).eq('id', input.id).select('id'), 'update partner')
    missing(updated, 'Partner')
    await audit('Super Admin', 'updated', 'Partner', `Updated partner "${input.name}"`)
  } else {
    await result(db.from('partners').insert({ id: id('p'), name: input.name, logo_url: input.logoUrl || null }), 'create partner')
    await audit('Super Admin', 'created', 'Partner', `Added partner "${input.name}"`)
  }
  touch()
}

export async function deletePartner(partnerId: string) {
  await assertAdmin()
  const deleted = await result(getDb().from('partners').delete().eq('id', partnerId).select('id'), 'delete partner')
  missing(deleted, 'Partner')
  await audit('Super Admin', 'deleted', 'Partner', `Removed partner ${partnerId}`)
  touch()
}

export async function saveVolunteer(input: { id?: string; name: string; email: string; phone: string; skills: string; interest: string; availability: string; message: string; status: Volunteer['status'] }) {
  await assertAdmin()
  const db = getDb()
  if (input.id) {
    const updated = await result(db.from('volunteers').update({
      name: input.name, email: input.email, phone: input.phone, skills: input.skills,
      interest: input.interest, availability: input.availability, message: input.message, status: input.status,
    }).eq('id', input.id).select('id'), 'update volunteer')
    missing(updated, 'Volunteer')
    await audit('Super Admin', 'updated', 'Volunteer', `Updated volunteer ${input.email}`)
  } else {
    await result(db.from('volunteers').insert({
      id: id('v'), name: input.name, email: input.email, phone: input.phone, skills: input.skills,
      interest: input.interest, availability: input.availability, message: input.message, status: input.status,
    }), 'create volunteer')
    await audit('Super Admin', 'created', 'Volunteer', `Added volunteer ${input.email}`)
  }
  touch()
}

export async function deleteVolunteer(volunteerId: string) {
  await assertAdmin()
  const deleted = await result(getDb().from('volunteers').delete().eq('id', volunteerId).select('id'), 'delete volunteer')
  missing(deleted, 'Volunteer')
  await audit('Super Admin', 'deleted', 'Volunteer', `Removed volunteer ${volunteerId}`)
  touch()
}

export async function saveUser(input: { id?: string; name: string; email: string; role: string; phone: string }) {
  await assertAdmin()
  const db = getDb()
  try {
    if (input.id) {
      const updated = await result(db.from('users').update({
        name: input.name, email: input.email, role: input.role, phone: input.phone || null,
      }).eq('id', input.id).select('id'), 'update user')
      missing(updated, 'User')
      await audit('Super Admin', 'updated', 'User', `Updated ${input.email}`)
    } else {
      await result(db.from('users').insert({ id: id('u'), name: input.name, email: input.email, role: input.role, phone: input.phone || null }), 'create user')
      await audit('Super Admin', 'created', 'User', `Added ${input.email}`)
    }
  } catch (error) {
    readable(error, 'The user could not be saved.')
  }
  touch()
}

export async function deleteUser(userId: string) {
  await assertAdmin()
  const deleted = await result(getDb().from('users').delete().eq('id', userId).select('id'), 'delete user')
  missing(deleted, 'User')
  await audit('Super Admin', 'deleted', 'User', `Removed user ${userId}`)
  touch()
}

export async function saveNews(input: { id?: string; title: string; excerpt: string; body: string; category: string; date: string }) {
  await assertAdmin()
  const db = getDb()
  try {
    if (input.id) {
      const updated = await result(db.from('news').update({
        title: input.title, excerpt: input.excerpt, body: input.body, category: input.category, date: input.date,
      }).eq('id', input.id).select('id'), 'update news article')
      missing(updated, 'Article')
    } else {
      await result(db.from('news').insert({
        id: id('nw'), slug: slugify(input.title), title: input.title, excerpt: input.excerpt, body: input.body,
        category: input.category, date: input.date, image: '/school-pesa-hero.png',
      }), 'create news article')
    }
  } catch (error) {
    readable(error, 'The article could not be saved.')
  }
  await audit('Content Manager', input.id ? 'updated' : 'created', 'News', `${input.id ? 'Updated' : 'Added'} "${input.title}"`)
  touch()
}

export async function deleteNews(articleId: string) {
  await assertAdmin()
  const deleted = await result(getDb().from('news').delete().eq('id', articleId).select('id'), 'delete news article')
  missing(deleted, 'Article')
  await audit('Content Manager', 'deleted', 'News', `Removed article ${articleId}`)
  touch()
}

export async function saveEvent(input: { id?: string; name: string; date: string; time: string; location: string; description: string }) {
  await assertAdmin()
  const db = getDb()
  if (input.id) {
    const updated = await result(db.from('events').update({
      name: input.name, date: input.date, time: input.time, location: input.location, description: input.description,
    }).eq('id', input.id).select('id'), 'update event')
    missing(updated, 'Event')
  } else {
    await result(db.from('events').insert({
      id: id('ev'), name: input.name, date: input.date, time: input.time, location: input.location,
      description: input.description, image: '/school-pesa-hero.png',
    }), 'create event')
  }
  await audit('Content Manager', input.id ? 'updated' : 'created', 'Event', `${input.id ? 'Updated' : 'Added'} "${input.name}"`)
  touch()
}

export async function deleteEvent(eventId: string) {
  await assertAdmin()
  const deleted = await result(getDb().from('events').delete().eq('id', eventId).select('id'), 'delete event')
  missing(deleted, 'Event')
  await audit('Content Manager', 'deleted', 'Event', `Removed event ${eventId}`)
  touch()
}

export async function saveFaq(input: { id?: string; question: string; answer: string; topic: string }) {
  await assertAdmin()
  const db = getDb()
  if (input.id) {
    const updated = await result(db.from('faqs').update({ question: input.question, answer: input.answer, topic: input.topic }).eq('id', input.id).select('id'), 'update FAQ')
    missing(updated, 'Question')
  } else {
    await result(db.from('faqs').insert({ id: id('f'), question: input.question, answer: input.answer, topic: input.topic }), 'create FAQ')
  }
  await audit('Content Manager', input.id ? 'updated' : 'created', 'FAQ', `${input.id ? 'Updated' : 'Added'} a question`)
  touch()
}

export async function deleteFaq(faqId: string) {
  await assertAdmin()
  const deleted = await result(getDb().from('faqs').delete().eq('id', faqId).select('id'), 'delete FAQ')
  missing(deleted, 'Question')
  await audit('Content Manager', 'deleted', 'FAQ', `Removed question ${faqId}`)
  touch()
}

export async function deleteAuditLog(logId: string) {
  await assertAdmin()
  const deleted = await result(getDb().from('audit_logs').delete().eq('id', logId).select('id'), 'delete audit log')
  missing(deleted, 'Log entry')
  touch()
}

type ImpactFields = { title: string; body: string; category: string; campaignId?: string; beneficiaryId?: string }

type ImpactRow = {
  id: string
  email: string
  title: string
  body: string
  status: string
  campaign_id: string | null
  beneficiary_id: string | null
  story_id: string | null
  category: string
}

async function impactRow(updateId: string) {
  const row = await result(getDb().from('donor_updates').select('id, email, title, body, status, campaign_id, beneficiary_id, story_id, category').eq('id', updateId).maybeSingle(), 'find impact update') as ImpactRow | null
  if (!row) throw new Error('That update was not found.')
  return row
}

async function impactFields(input: ImpactFields) {
  const title = input.title.trim()
  const body = input.body.trim()
  if (!title || !body) throw new Error('Add a title and a note.')
  if (!storyCategories.includes(input.category)) throw new Error('Choose a story category.')
  const campaignId = input.campaignId?.trim() || null
  const beneficiaryId = input.beneficiaryId?.trim() || null
  const db = getDb()
  if (campaignId && !await result(db.from('campaigns').select('id').eq('id', campaignId).maybeSingle(), 'check campaign')) throw new Error('That campaign is not on file.')
  if (beneficiaryId && !await result(db.from('beneficiaries').select('id').eq('id', beneficiaryId).maybeSingle(), 'check learner')) throw new Error('That learner is not on file.')
  return { title, body, category: input.category, campaignId, beneficiaryId }
}

async function notifyDonor(email: string, title: string, body: string) {
  await alertDonor(email, { title, body, kind: 'update', href: '/dashboard/updates' })
}

async function syncStory(row: ImpactRow, fields: Awaited<ReturnType<typeof impactFields>>, status: 'draft' | 'published') {
  const db = getDb()
  const campaign = fields.campaignId
    ? await result(db.from('campaigns').select('image').eq('id', fields.campaignId).maybeSingle(), 'read campaign image') as { image: string | null } | null
    : undefined
  const learner = fields.beneficiaryId
    ? await result(db.from('beneficiaries').select('image').eq('id', fields.beneficiaryId).maybeSingle(), 'read learner image') as { image: string | null } | null
    : undefined
  const authorRow = await result(db.from('users').select('name').ilike('email', row.email).maybeSingle(), 'read donor name') as { name: string } | null
  const author = authorRow?.name || 'School Pesa donor'
  const image = campaign?.image || learner?.image || '/school-pesa-hero.png'
  const excerpt = fields.body.replace(/\s+/g, ' ').slice(0, 160)
  const today = new Date().toISOString().slice(0, 10)
  if (row.story_id) {
    const updated = await result(db.from('stories').update({
      title: fields.title, excerpt, body: fields.body, category: fields.category, author, image,
      campaign_id: fields.campaignId, beneficiary_id: fields.beneficiaryId, status,
    }).eq('id', row.story_id).select('id'), 'update impact story')
    missing(updated, 'Story')
    return row.story_id
  }
  const storyId = id('st')
  let slug = slugify(fields.title)
  if (await result(db.from('stories').select('id').eq('slug', slug).maybeSingle(), 'check story address')) slug = `${slug}-${storyId.slice(-6)}`
  await result(db.from('stories').insert({
    id: storyId, slug, title: fields.title, excerpt, body: fields.body, category: fields.category, author,
    date: today, image, gallery: [], campaign_id: fields.campaignId, beneficiary_id: fields.beneficiaryId, status, views: 0,
  }), 'create impact story')
  return storyId
}

export async function saveImpactUpdate(updateId: string, input: ImpactFields) {
  await assertAdmin()
  const row = await impactRow(updateId)
  const fields = await impactFields(input)
  const storyId = row.story_id && row.status === 'published' ? await syncStory(row, fields, 'published') : row.story_id
  const updated = await result(getDb().from('donor_updates').update({
    title: fields.title, body: fields.body, category: fields.category, campaign_id: fields.campaignId,
    beneficiary_id: fields.beneficiaryId, story_id: storyId,
  }).eq('id', updateId).select('id'), 'update impact update')
  missing(updated, 'Impact update')
  await audit('Content Manager', 'updated', 'Impact update', `Edited “${fields.title}” from ${row.email}`)
  touch()
}

export async function requestImpactChanges(updateId: string, note: string) {
  await assertAdmin()
  const row = await impactRow(updateId)
  const message = note.trim()
  if (!message) throw new Error('Tell the donor what to change.')
  if (row.status === 'draft') throw new Error('This update has not been submitted.')
  const db = getDb()
  if (row.story_id) await result(db.from('stories').update({ status: 'draft' }).eq('id', row.story_id), 'unpublish impact story')
  await result(db.from('donor_updates').update({ status: 'changes', review_note: message }).eq('id', updateId), 'request impact update changes')
  await notifyDonor(row.email, 'Update needs changes', `“${row.title}” was sent back: ${message}`)
  await audit('Content Manager', 'reviewed', 'Impact update', `Requested changes on “${row.title}”`)
  touch()
}

export async function declineImpactUpdate(updateId: string, note: string) {
  await assertAdmin()
  const row = await impactRow(updateId)
  const message = note.trim()
  if (!message) throw new Error('Add a reason for declining this update.')
  if (row.status === 'draft') throw new Error('This update has not been submitted.')
  const db = getDb()
  if (row.story_id) await result(db.from('stories').update({ status: 'draft' }).eq('id', row.story_id), 'unpublish impact story')
  await result(db.from('donor_updates').update({ status: 'declined', review_note: message }).eq('id', updateId), 'decline impact update')
  await notifyDonor(row.email, 'Update was not published', `“${row.title}” was declined: ${message}`)
  await audit('Content Manager', 'declined', 'Impact update', `Declined “${row.title}”`)
  touch()
}

export async function publishImpactUpdate(updateId: string, input: ImpactFields) {
  await assertAdmin()
  const row = await impactRow(updateId)
  if (row.status === 'draft') throw new Error('Wait until the donor submits this update.')
  const fields = await impactFields(input)
  const storyId = await syncStory({ ...row, story_id: row.story_id }, fields, 'published')
  const updated = await result(getDb().from('donor_updates').update({
    title: fields.title, body: fields.body, category: fields.category, campaign_id: fields.campaignId,
    beneficiary_id: fields.beneficiaryId, story_id: storyId, status: 'published', review_note: '',
  }).eq('id', updateId).select('id'), 'publish impact update')
  missing(updated, 'Impact update')
  await notifyDonor(row.email, 'Your update is published', `“${fields.title}” is now a public story.`)
  await alertFollowers({ campaignId: fields.campaignId, beneficiaryId: fields.beneficiaryId, title: 'New impact update', body: `“${fields.title}” was published.`, href: '/dashboard/updates', exceptEmail: row.email })
  await audit('Content Manager', 'published', 'Impact update', `Published “${fields.title}” from ${row.email}`)
  touch()
  revalidatePath('/stories')
}

export async function unpublishImpactUpdate(updateId: string) {
  await assertAdmin()
  const row = await impactRow(updateId)
  if (row.status !== 'published' || !row.story_id) throw new Error('This update is not published.')
  const db = getDb()
  await result(db.from('stories').update({ status: 'draft' }).eq('id', row.story_id), 'unpublish impact story')
  await result(db.from('donor_updates').update({ status: 'submitted' }).eq('id', updateId), 'return impact update to review')
  await notifyDonor(row.email, 'Update unpublished', `“${row.title}” was taken off the public site and is back in review.`)
  await audit('Content Manager', 'unpublished', 'Impact update', `Unpublished “${row.title}”`)
  touch()
  revalidatePath('/stories')
}
