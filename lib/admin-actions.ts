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

function audit(user: string, action: string, resource: string, details: string) {
  const now = new Date()
  getDb().prepare('INSERT INTO audit_logs (id, user, action, resource, date, time, details) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id('a'),
    user,
    action,
    resource,
    now.toISOString().slice(0, 10),
    now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    details,
  )
}

function touch() {
  for (const path of ['/admin', '/admin/campaigns', '/admin/beneficiaries', '/admin/donations', '/admin/stories', '/admin/gallery', '/admin/finance', '/admin/people', '/admin/users', '/admin/content', '/admin/settings', '/admin/reports', '/admin/audit-logs', '/admin/updates', '/campaigns', '/stories', '/gallery', '/news', '/events', '/sponsor', '/impact', '/dashboard', '/dashboard/donations', '/dashboard/receipts', '/dashboard/updates', '/dashboard/notifications']) {
    revalidatePath(path)
  }
}

function missing(result: { changes: number | bigint }, label: string) {
  if (Number(result.changes) === 0) throw new Error(`${label} was not found.`)
}

function readable(error: unknown, fallback: string): never {
  const message = error instanceof Error ? error.message : fallback
  if (/UNIQUE/i.test(message)) throw new Error('A record with that name or address already exists.')
  throw error instanceof Error ? error : new Error(fallback)
}

type GiftRow = { id: string; amount: number; campaign_id: string | null; beneficiary_id: string | null; status: string }

function moveRaised(row: GiftRow, next: string) {
  const db = getDb()
  const wasSuccessful = row.status === 'Successful'
  if (next === 'Successful' && !wasSuccessful) {
    if (row.campaign_id) db.prepare('UPDATE campaigns SET raised = raised + ?, donors = donors + 1 WHERE id = ?').run(row.amount, row.campaign_id)
    if (row.beneficiary_id) db.prepare('UPDATE beneficiaries SET raised = raised + ? WHERE id = ?').run(row.amount, row.beneficiary_id)
    db.prepare('UPDATE impact_stats SET funds_raised = funds_raised + ?, this_month = this_month + ? WHERE id = 1').run(row.amount, row.amount)
  }
  if (wasSuccessful && next !== 'Successful') {
    if (row.campaign_id) db.prepare('UPDATE campaigns SET raised = MAX(raised - ?, 0), donors = MAX(donors - 1, 0) WHERE id = ?').run(row.amount, row.campaign_id)
    if (row.beneficiary_id) db.prepare('UPDATE beneficiaries SET raised = MAX(raised - ?, 0) WHERE id = ?').run(row.amount, row.beneficiary_id)
    db.prepare('UPDATE impact_stats SET funds_raised = MAX(funds_raised - ?, 0) WHERE id = 1').run(row.amount)
  }
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
    const result = getDb().prepare(`UPDATE campaigns SET slug = ?, title = ?, summary = ?, description = ?, story = ?, category = ?, level = ?, location = ?, status = ?, target = ?, deadline = ?, created_at = ?, image = ?, gallery = ?, video = ?, beneficiary_id = ?, seo_title = ?, seo_description = ? WHERE id = ?`).run(
      slugify(input.slug || title),
      title,
      input.summary.trim(),
      input.description.trim(),
      input.description.trim(),
      input.category.trim() || 'School Fees',
      input.level,
      input.location.trim(),
      input.status,
      target,
      input.deadline,
      input.createdAt || new Date().toISOString().slice(0, 10),
      input.image?.trim() || '/school-pesa-hero.png',
      gallery,
      input.video?.trim() || null,
      input.beneficiaryId || null,
      input.seoTitle.trim() || title,
      input.seoDescription.trim() || input.summary.trim(),
      campaignId,
    )
    missing(result, 'Campaign')
  } catch (error) {
    readable(error, 'The campaign could not be updated.')
  }
  syncCampaignImpact()
  audit('Campaign Manager', 'updated', 'Campaign', `Updated campaign "${title}"`)
  revalidatePath('/campaigns/[slug]', 'page')
  touch()
}

export async function deleteCampaign(campaignId: string) {
  await assertAdmin()
  const db = getDb()
  const existing = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(campaignId)
  if (!existing) throw new Error('Campaign was not found.')
  db.exec('BEGIN')
  try {
    db.prepare('UPDATE donations SET campaign_id = NULL WHERE campaign_id = ?').run(campaignId)
    db.prepare('UPDATE stories SET campaign_id = NULL WHERE campaign_id = ?').run(campaignId)
    db.prepare('UPDATE expenses SET campaign_id = NULL WHERE campaign_id = ?').run(campaignId)
    db.prepare('UPDATE gallery SET campaign_id = NULL WHERE campaign_id = ?').run(campaignId)
    db.prepare('DELETE FROM campaign_links WHERE campaign_id = ?').run(campaignId)
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(campaignId)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  syncCampaignImpact()
  audit('Campaign Manager', 'deleted', 'Campaign', `Removed campaign ${campaignId}`)
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
    const existing = db.prepare('SELECT image FROM beneficiaries WHERE id = ?').get(input.id) as { image: string } | undefined
    if (!existing) throw new Error('Learner was not found.')
    const result = db.prepare(`UPDATE beneficiaries SET display_name = ?, level = ?, school = ?, location = ?, story = ?, needs = ?, target = ?, image = ?, public_profile = ?, public_image = ?, story_visible = ?, status = ? WHERE id = ?`).run(
      name, input.level, input.school.trim(), input.location.trim(), story, input.needs.trim(), input.target, photo || existing.image, profile, imageFlag, visible, input.status, input.id,
    )
    missing(result, 'Learner')
    audit('Campaign Manager', 'updated', 'Beneficiary', `Updated learner "${name}"`)
  } else {
    db.prepare(`INSERT INTO beneficiaries (id, display_name, level, school, location, story, needs, target, raised, image, public_profile, public_image, story_visible, status, updates)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, '[]')`).run(
      id('ben'), name, input.level, input.school.trim(), input.location.trim(), story, input.needs.trim(), input.target, photo || '/school-pesa-hero.png', profile, imageFlag, visible, input.status,
    )
    audit('Campaign Manager', 'created', 'Beneficiary', `Added learner "${name}"`)
  }
  revalidatePath('/sponsor/[id]', 'page')
  revalidatePath('/dashboard/sponsored')
  touch()
}

export async function deleteBeneficiary(beneficiaryId: string) {
  await assertAdmin()
  const db = getDb()
  const existing = db.prepare('SELECT display_name FROM beneficiaries WHERE id = ?').get(beneficiaryId) as { display_name: string } | undefined
  if (!existing) throw new Error('Learner was not found.')
  db.exec('BEGIN')
  try {
    db.prepare('UPDATE donations SET beneficiary_id = NULL WHERE beneficiary_id = ?').run(beneficiaryId)
    db.prepare('UPDATE stories SET beneficiary_id = NULL WHERE beneficiary_id = ?').run(beneficiaryId)
    db.prepare('UPDATE campaigns SET beneficiary_id = NULL WHERE beneficiary_id = ?').run(beneficiaryId)
    db.prepare('UPDATE donor_updates SET beneficiary_id = NULL WHERE beneficiary_id = ?').run(beneficiaryId)
    db.prepare('DELETE FROM sponsorships WHERE beneficiary_id = ?').run(beneficiaryId)
    db.prepare('DELETE FROM beneficiaries WHERE id = ?').run(beneficiaryId)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  audit('Campaign Manager', 'deleted', 'Beneficiary', `Removed learner "${existing.display_name}"`)
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

function giftFields(input: GiftInput) {
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
  if (campaignId && !db.prepare('SELECT id FROM campaigns WHERE id = ?').get(campaignId)) throw new Error('That campaign is not on file.')
  if (beneficiaryId && !db.prepare('SELECT id FROM beneficiaries WHERE id = ?').get(beneficiaryId)) throw new Error('That learner is not on file.')
  const support = beneficiaryId ? 'child' : campaignId ? 'campaign' : 'general'
  return { donorName, email, phone, amount, date, method, campaignId, beneficiaryId, support, message: input.message.trim() }
}

export async function createAdminDonation(input: GiftInput) {
  await assertAdmin()
  const fields = giftFields(input)
  const donationId = id('d')
  const reference = `ADM-${Date.now().toString(36).toUpperCase()}`
  const db = getDb()
  db.prepare(`INSERT INTO donations (id, donor_name, anonymous, email, phone, amount, frequency, campaign_id, beneficiary_id, support_target, method, transaction_id, date, status, message, created_at)
    VALUES (?, ?, 0, ?, ?, ?, 'one-time', ?, ?, ?, ?, ?, ?, 'Successful', ?, ?)`).run(
    donationId, fields.donorName, fields.email, fields.phone, fields.amount, fields.campaignId, fields.beneficiaryId, fields.support, fields.method, reference, fields.date, fields.message || null, new Date().toISOString(),
  )
  db.prepare('INSERT INTO transactions (id, donation_id, provider, reference, amount, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id('pt'), donationId, fields.method, reference, fields.amount, 'Successful', fields.date,
  )
  moveRaised({ id: donationId, amount: fields.amount, campaign_id: fields.campaignId, beneficiary_id: fields.beneficiaryId, status: 'Pending' }, 'Successful')
  alertDonor(fields.email, { title: 'Gift confirmed', body: `${formatUGX(fields.amount)} is confirmed. Reference ${reference}.`, kind: 'gift', href: '/dashboard/receipts' })
  audit('Finance Admin', 'created', 'Donation', `Recorded gift ${reference}`)
  touch()
}

export async function updateAdminDonation(donationId: string, input: GiftInput) {
  await assertAdmin()
  const fields = giftFields(input)
  const db = getDb()
  const row = db.prepare('SELECT id, amount, campaign_id, beneficiary_id, status FROM donations WHERE id = ?').get(donationId) as GiftRow | undefined
  if (!row) throw new Error('Gift was not found.')
  if (row.status === 'Successful') moveRaised(row, 'Cancelled')
  db.prepare(`UPDATE donations SET donor_name = ?, email = ?, phone = ?, amount = ?, method = ?, date = ?, campaign_id = ?, beneficiary_id = ?, support_target = ?, message = ? WHERE id = ?`).run(
    fields.donorName, fields.email, fields.phone, fields.amount, fields.method, fields.date, fields.campaignId, fields.beneficiaryId, fields.support, fields.message || null, donationId,
  )
  db.prepare('UPDATE transactions SET provider = ?, amount = ?, date = ? WHERE donation_id = ?').run(fields.method, fields.amount, fields.date, donationId)
  if (row.status === 'Successful') moveRaised({ ...row, amount: fields.amount, campaign_id: fields.campaignId, beneficiary_id: fields.beneficiaryId, status: 'Pending' }, 'Successful')
  audit('Finance Admin', 'updated', 'Donation', `Updated gift for ${fields.donorName}`)
  touch()
}

export async function deleteAdminDonation(donationId: string) {
  await assertAdmin()
  const db = getDb()
  const row = db.prepare('SELECT id, amount, campaign_id, beneficiary_id, status FROM donations WHERE id = ?').get(donationId) as GiftRow | undefined
  if (!row) throw new Error('Gift was not found.')
  if (row.status === 'Successful') moveRaised(row, 'Cancelled')
  db.prepare('DELETE FROM transactions WHERE donation_id = ?').run(donationId)
  db.prepare('DELETE FROM donations WHERE id = ?').run(donationId)
  audit('Finance Admin', 'deleted', 'Donation', `Removed gift ${donationId}`)
  touch()
}

export async function updateStory(storyId: string, input: { title: string; body: string; category: string; status: Story['status'] }) {
  await assertAdmin()
  const result = getDb().prepare('UPDATE stories SET title = ?, excerpt = ?, body = ?, category = ?, status = ? WHERE id = ?').run(
    input.title, input.body.slice(0, 140), input.body, input.category, input.status, storyId,
  )
  missing(result, 'Story')
  audit('Content Manager', 'updated', 'Story', `Updated story "${input.title}"`)
  touch()
}

export async function deleteStory(storyId: string) {
  await assertAdmin()
  const db = getDb()
  const existing = db.prepare('SELECT title FROM stories WHERE id = ?').get(storyId) as { title: string } | undefined
  if (!existing) throw new Error('Story was not found.')
  db.prepare('UPDATE gallery SET story_id = NULL WHERE story_id = ?').run(storyId)
  db.prepare('DELETE FROM stories WHERE id = ?').run(storyId)
  audit('Content Manager', 'deleted', 'Story', `Removed story "${existing.title}"`)
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
  if (campaignId && !db.prepare('SELECT id FROM campaigns WHERE id = ?').get(campaignId)) throw new Error('That campaign is not on file.')
  if (beneficiaryId && !db.prepare('SELECT id FROM beneficiaries WHERE id = ?').get(beneficiaryId)) throw new Error('That learner is not on file.')
  const base = slugify(title)
  let slug = base
  let suffix = 2
  while (db.prepare('SELECT id FROM stories WHERE slug = ? AND id != ?').get(slug, input.id ?? '')) slug = `${base}-${suffix++}`
  if (input.id) {
    const result = db.prepare('UPDATE stories SET slug = ?, title = ?, excerpt = ?, body = ?, category = ?, author = ?, image = ?, campaign_id = ?, beneficiary_id = ?, status = ? WHERE id = ?').run(
      slug, title, excerpt, body, category, author, image, campaignId, beneficiaryId, input.status, input.id,
    )
    missing(result, 'Story')
    audit('Content Manager', 'updated', 'Story', `Updated story "${title}"`)
  } else {
    const today = new Date().toISOString().slice(0, 10)
    db.prepare(`INSERT INTO stories (id, slug, title, excerpt, body, category, author, date, image, gallery, campaign_id, beneficiary_id, status, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, 0)`).run(
      id('st'), slug, title, excerpt, body, category, author, today, image, campaignId, beneficiaryId, input.status,
    )
    audit('Content Manager', 'created', 'Story', `Saved story "${title}"`)
  }
  revalidatePath('/stories/[slug]', 'page')
  touch()
}

export async function setStoryStatus(storyId: string, status: string) {
  await assertAdmin()
  if (!storyStatuses.has(status)) throw new Error('Choose a status.')
  const existing = getDb().prepare('SELECT title FROM stories WHERE id = ?').get(storyId) as { title: string } | undefined
  if (!existing) throw new Error('Story was not found.')
  getDb().prepare('UPDATE stories SET status = ? WHERE id = ?').run(status, storyId)
  audit('Content Manager', status === 'published' ? 'published' : 'unpublished', 'Story', `${status === 'published' ? 'Published' : 'Unpublished'} "${existing.title}"`)
  revalidatePath('/stories/[slug]', 'page')
  touch()
}

export async function updateGalleryItem(itemId: string, input: { alt: string; caption: string; category: string }) {
  await assertAdmin()
  const result = getDb().prepare('UPDATE gallery SET alt = ?, caption = ?, category = ? WHERE id = ?').run(
    input.alt, input.caption, input.category, itemId,
  )
  missing(result, 'Photo')
  audit('Content Manager', 'updated', 'Gallery', `Updated photo ${itemId}`)
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
  if (campaignId && !db.prepare('SELECT id FROM campaigns WHERE id = ?').get(campaignId)) throw new Error('That campaign is not on file.')
  if (input.id) {
    const result = db.prepare('UPDATE expenses SET date = ?, category = ?, campaign_id = ?, description = ?, amount = ?, supplier = ?, receipt = ?, status = ? WHERE id = ?').run(
      date, category, campaignId, description, amount, supplier, receipt, input.status, input.id,
    )
    missing(result, 'Expense')
    audit('Finance Admin', 'updated', 'Expense', `Updated ${receipt}`)
  } else {
    db.prepare('INSERT INTO expenses (id, date, category, campaign_id, description, amount, supplier, receipt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      id('x'), date, category, campaignId, description, amount, supplier, receipt, input.status,
    )
    audit('Finance Admin', 'recorded', 'Expense', `Recorded ${receipt}`)
  }
  touch()
}

export async function updateExpense(expenseId: string, input: Omit<Expense, 'id'>) {
  await assertAdmin()
  const result = getDb().prepare('UPDATE expenses SET date = ?, category = ?, campaign_id = ?, description = ?, amount = ?, supplier = ?, receipt = ?, status = ? WHERE id = ?').run(
    input.date, input.category, input.campaignId ?? null, input.description, input.amount, input.supplier, input.receipt, input.status, expenseId,
  )
  missing(result, 'Expense')
  audit('Finance Admin', 'updated', 'Expense', `Updated ${input.receipt || expenseId}`)
  touch()
}

export async function deleteExpense(expenseId: string) {
  await assertAdmin()
  const result = getDb().prepare('DELETE FROM expenses WHERE id = ?').run(expenseId)
  missing(result, 'Expense')
  audit('Finance Admin', 'deleted', 'Expense', `Removed expense ${expenseId}`)
  touch()
}

export async function savePartner(input: { id?: string; name: string; logoUrl?: string }) {
  await assertAdmin()
  const db = getDb()
  if (input.id) {
    const result = db.prepare('UPDATE partners SET name = ?, logo_url = ? WHERE id = ?').run(input.name, input.logoUrl || null, input.id)
    missing(result, 'Partner')
    audit('Super Admin', 'updated', 'Partner', `Updated partner "${input.name}"`)
  } else {
    db.prepare('INSERT INTO partners (id, name, logo_url) VALUES (?, ?, ?)').run(id('p'), input.name, input.logoUrl || null)
    audit('Super Admin', 'created', 'Partner', `Added partner "${input.name}"`)
  }
  touch()
}

export async function deletePartner(partnerId: string) {
  await assertAdmin()
  const result = getDb().prepare('DELETE FROM partners WHERE id = ?').run(partnerId)
  missing(result, 'Partner')
  audit('Super Admin', 'deleted', 'Partner', `Removed partner ${partnerId}`)
  touch()
}

export async function saveVolunteer(input: { id?: string; name: string; email: string; phone: string; skills: string; interest: string; availability: string; message: string; status: Volunteer['status'] }) {
  await assertAdmin()
  const db = getDb()
  if (input.id) {
    const result = db.prepare('UPDATE volunteers SET name = ?, email = ?, phone = ?, skills = ?, interest = ?, availability = ?, message = ?, status = ? WHERE id = ?').run(
      input.name, input.email, input.phone, input.skills, input.interest, input.availability, input.message, input.status, input.id,
    )
    missing(result, 'Volunteer')
    audit('Super Admin', 'updated', 'Volunteer', `Updated volunteer ${input.email}`)
  } else {
    db.prepare('INSERT INTO volunteers (id, name, email, phone, skills, interest, availability, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      id('v'), input.name, input.email, input.phone, input.skills, input.interest, input.availability, input.message, input.status,
    )
    audit('Super Admin', 'created', 'Volunteer', `Added volunteer ${input.email}`)
  }
  touch()
}

export async function deleteVolunteer(volunteerId: string) {
  await assertAdmin()
  const result = getDb().prepare('DELETE FROM volunteers WHERE id = ?').run(volunteerId)
  missing(result, 'Volunteer')
  audit('Super Admin', 'deleted', 'Volunteer', `Removed volunteer ${volunteerId}`)
  touch()
}

export async function saveUser(input: { id?: string; name: string; email: string; role: string; phone: string }) {
  await assertAdmin()
  const db = getDb()
  try {
    if (input.id) {
      const result = db.prepare('UPDATE users SET name = ?, email = ?, role = ?, phone = ? WHERE id = ?').run(input.name, input.email, input.role, input.phone || null, input.id)
      missing(result, 'User')
      audit('Super Admin', 'updated', 'User', `Updated ${input.email}`)
    } else {
      db.prepare('INSERT INTO users (id, name, email, role, phone) VALUES (?, ?, ?, ?, ?)').run(id('u'), input.name, input.email, input.role, input.phone || null)
      audit('Super Admin', 'created', 'User', `Added ${input.email}`)
    }
  } catch (error) {
    readable(error, 'The user could not be saved.')
  }
  touch()
}

export async function deleteUser(userId: string) {
  await assertAdmin()
  const result = getDb().prepare('DELETE FROM users WHERE id = ?').run(userId)
  missing(result, 'User')
  audit('Super Admin', 'deleted', 'User', `Removed user ${userId}`)
  touch()
}

export async function saveNews(input: { id?: string; title: string; excerpt: string; body: string; category: string; date: string }) {
  await assertAdmin()
  const db = getDb()
  try {
    if (input.id) {
      const result = db.prepare('UPDATE news SET title = ?, excerpt = ?, body = ?, category = ?, date = ? WHERE id = ?').run(input.title, input.excerpt, input.body, input.category, input.date, input.id)
      missing(result, 'Article')
    } else {
      db.prepare('INSERT INTO news (id, slug, title, excerpt, body, category, date, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        id('nw'), slugify(input.title), input.title, input.excerpt, input.body, input.category, input.date, '/school-pesa-hero.png',
      )
    }
  } catch (error) {
    readable(error, 'The article could not be saved.')
  }
  audit('Content Manager', input.id ? 'updated' : 'created', 'News', `${input.id ? 'Updated' : 'Added'} "${input.title}"`)
  touch()
}

export async function deleteNews(articleId: string) {
  await assertAdmin()
  const result = getDb().prepare('DELETE FROM news WHERE id = ?').run(articleId)
  missing(result, 'Article')
  audit('Content Manager', 'deleted', 'News', `Removed article ${articleId}`)
  touch()
}

export async function saveEvent(input: { id?: string; name: string; date: string; time: string; location: string; description: string }) {
  await assertAdmin()
  const db = getDb()
  if (input.id) {
    const result = db.prepare('UPDATE events SET name = ?, date = ?, time = ?, location = ?, description = ? WHERE id = ?').run(input.name, input.date, input.time, input.location, input.description, input.id)
    missing(result, 'Event')
  } else {
    db.prepare('INSERT INTO events (id, name, date, time, location, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id('ev'), input.name, input.date, input.time, input.location, input.description, '/school-pesa-hero.png',
    )
  }
  audit('Content Manager', input.id ? 'updated' : 'created', 'Event', `${input.id ? 'Updated' : 'Added'} "${input.name}"`)
  touch()
}

export async function deleteEvent(eventId: string) {
  await assertAdmin()
  const result = getDb().prepare('DELETE FROM events WHERE id = ?').run(eventId)
  missing(result, 'Event')
  audit('Content Manager', 'deleted', 'Event', `Removed event ${eventId}`)
  touch()
}

export async function saveFaq(input: { id?: string; question: string; answer: string; topic: string }) {
  await assertAdmin()
  const db = getDb()
  if (input.id) {
    const result = db.prepare('UPDATE faqs SET question = ?, answer = ?, topic = ? WHERE id = ?').run(input.question, input.answer, input.topic, input.id)
    missing(result, 'Question')
  } else {
    db.prepare('INSERT INTO faqs (id, question, answer, topic) VALUES (?, ?, ?, ?)').run(id('f'), input.question, input.answer, input.topic)
  }
  audit('Content Manager', input.id ? 'updated' : 'created', 'FAQ', `${input.id ? 'Updated' : 'Added'} a question`)
  touch()
}

export async function deleteFaq(faqId: string) {
  await assertAdmin()
  const result = getDb().prepare('DELETE FROM faqs WHERE id = ?').run(faqId)
  missing(result, 'Question')
  audit('Content Manager', 'deleted', 'FAQ', `Removed question ${faqId}`)
  touch()
}

export async function deleteAuditLog(logId: string) {
  await assertAdmin()
  const result = getDb().prepare('DELETE FROM audit_logs WHERE id = ?').run(logId)
  missing(result, 'Log entry')
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

function impactRow(updateId: string) {
  const row = getDb().prepare('SELECT id, email, title, body, status, campaign_id, beneficiary_id, story_id, category FROM donor_updates WHERE id = ?').get(updateId) as ImpactRow | undefined
  if (!row) throw new Error('That update was not found.')
  return row
}

function impactFields(input: ImpactFields) {
  const title = input.title.trim()
  const body = input.body.trim()
  if (!title || !body) throw new Error('Add a title and a note.')
  if (!storyCategories.includes(input.category)) throw new Error('Choose a story category.')
  const campaignId = input.campaignId?.trim() || null
  const beneficiaryId = input.beneficiaryId?.trim() || null
  const db = getDb()
  if (campaignId && !db.prepare('SELECT id FROM campaigns WHERE id = ?').get(campaignId)) throw new Error('That campaign is not on file.')
  if (beneficiaryId && !db.prepare('SELECT id FROM beneficiaries WHERE id = ?').get(beneficiaryId)) throw new Error('That learner is not on file.')
  return { title, body, category: input.category, campaignId, beneficiaryId }
}

function notifyDonor(email: string, title: string, body: string) {
  alertDonor(email, { title, body, kind: 'update', href: '/dashboard/updates' })
}

function syncStory(row: ImpactRow, fields: ReturnType<typeof impactFields>, status: 'draft' | 'published') {
  const db = getDb()
  const campaign = fields.campaignId
    ? db.prepare('SELECT image FROM campaigns WHERE id = ?').get(fields.campaignId) as { image: string } | undefined
    : undefined
  const learner = fields.beneficiaryId
    ? db.prepare('SELECT image FROM beneficiaries WHERE id = ?').get(fields.beneficiaryId) as { image: string } | undefined
    : undefined
  const authorRow = db.prepare('SELECT name FROM users WHERE lower(email) = ?').get(row.email) as { name: string } | undefined
  const author = authorRow?.name || 'School Pesa donor'
  const image = campaign?.image || learner?.image || '/school-pesa-hero.png'
  const excerpt = fields.body.replace(/\s+/g, ' ').slice(0, 160)
  const today = new Date().toISOString().slice(0, 10)
  if (row.story_id) {
    db.prepare('UPDATE stories SET title = ?, excerpt = ?, body = ?, category = ?, author = ?, image = ?, campaign_id = ?, beneficiary_id = ?, status = ? WHERE id = ?').run(
      fields.title, excerpt, fields.body, fields.category, author, image, fields.campaignId, fields.beneficiaryId, status, row.story_id,
    )
    return row.story_id
  }
  const storyId = id('st')
  let slug = slugify(fields.title)
  if (db.prepare('SELECT id FROM stories WHERE slug = ?').get(slug)) slug = `${slug}-${storyId.slice(-6)}`
  db.prepare(`INSERT INTO stories (id, slug, title, excerpt, body, category, author, date, image, gallery, campaign_id, beneficiary_id, status, views)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, 0)`).run(
    storyId, slug, fields.title, excerpt, fields.body, fields.category, author, today, image, fields.campaignId, fields.beneficiaryId, status,
  )
  return storyId
}

export async function saveImpactUpdate(updateId: string, input: ImpactFields) {
  await assertAdmin()
  const row = impactRow(updateId)
  const fields = impactFields(input)
  const storyId = row.story_id && row.status === 'published' ? syncStory(row, fields, 'published') : row.story_id
  getDb().prepare('UPDATE donor_updates SET title = ?, body = ?, category = ?, campaign_id = ?, beneficiary_id = ?, story_id = ? WHERE id = ?').run(
    fields.title, fields.body, fields.category, fields.campaignId, fields.beneficiaryId, storyId, updateId,
  )
  audit('Content Manager', 'updated', 'Impact update', `Edited “${fields.title}” from ${row.email}`)
  touch()
}

export async function requestImpactChanges(updateId: string, note: string) {
  await assertAdmin()
  const row = impactRow(updateId)
  const message = note.trim()
  if (!message) throw new Error('Tell the donor what to change.')
  if (row.status === 'draft') throw new Error('This update has not been submitted.')
  const db = getDb()
  if (row.story_id) db.prepare("UPDATE stories SET status = 'draft' WHERE id = ?").run(row.story_id)
  db.prepare("UPDATE donor_updates SET status = 'changes', review_note = ? WHERE id = ?").run(message, updateId)
  notifyDonor(row.email, 'Update needs changes', `“${row.title}” was sent back: ${message}`)
  audit('Content Manager', 'reviewed', 'Impact update', `Requested changes on “${row.title}”`)
  touch()
}

export async function declineImpactUpdate(updateId: string, note: string) {
  await assertAdmin()
  const row = impactRow(updateId)
  const message = note.trim()
  if (!message) throw new Error('Add a reason for declining this update.')
  if (row.status === 'draft') throw new Error('This update has not been submitted.')
  const db = getDb()
  if (row.story_id) db.prepare("UPDATE stories SET status = 'draft' WHERE id = ?").run(row.story_id)
  db.prepare("UPDATE donor_updates SET status = 'declined', review_note = ? WHERE id = ?").run(message, updateId)
  notifyDonor(row.email, 'Update was not published', `“${row.title}” was declined: ${message}`)
  audit('Content Manager', 'declined', 'Impact update', `Declined “${row.title}”`)
  touch()
}

export async function publishImpactUpdate(updateId: string, input: ImpactFields) {
  await assertAdmin()
  const row = impactRow(updateId)
  if (row.status === 'draft') throw new Error('Wait until the donor submits this update.')
  const fields = impactFields(input)
  const storyId = syncStory({ ...row, story_id: row.story_id }, fields, 'published')
  getDb().prepare("UPDATE donor_updates SET title = ?, body = ?, category = ?, campaign_id = ?, beneficiary_id = ?, story_id = ?, status = 'published', review_note = '' WHERE id = ?").run(
    fields.title, fields.body, fields.category, fields.campaignId, fields.beneficiaryId, storyId, updateId,
  )
  notifyDonor(row.email, 'Your update is published', `“${fields.title}” is now a public story.`)
  alertFollowers({ campaignId: fields.campaignId, beneficiaryId: fields.beneficiaryId, title: 'New impact update', body: `“${fields.title}” was published.`, href: '/dashboard/updates', exceptEmail: row.email })
  audit('Content Manager', 'published', 'Impact update', `Published “${fields.title}” from ${row.email}`)
  touch()
  revalidatePath('/stories')
}

export async function unpublishImpactUpdate(updateId: string) {
  await assertAdmin()
  const row = impactRow(updateId)
  if (row.status !== 'published' || !row.story_id) throw new Error('This update is not published.')
  const db = getDb()
  db.prepare("UPDATE stories SET status = 'draft' WHERE id = ?").run(row.story_id)
  db.prepare("UPDATE donor_updates SET status = 'submitted' WHERE id = ?").run(updateId)
  notifyDonor(row.email, 'Update unpublished', `“${row.title}” was taken off the public site and is back in review.`)
  audit('Content Manager', 'unpublished', 'Impact update', `Unpublished “${row.title}”`)
  touch()
  revalidatePath('/stories')
}
