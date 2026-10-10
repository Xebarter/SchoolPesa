'use server'

import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import type { CampaignStatus, DonationStatus, Expense, Story, Volunteer } from '@/lib/types'

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
  for (const path of ['/admin', '/admin/campaigns', '/admin/beneficiaries', '/admin/donations', '/admin/stories', '/admin/gallery', '/admin/finance', '/admin/people', '/admin/users', '/admin/content', '/admin/settings', '/admin/reports', '/admin/audit-logs', '/campaigns', '/stories', '/gallery', '/news', '/events', '/sponsor', '/impact']) {
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
  video?: string
  seoTitle: string
  seoDescription: string
  status: CampaignStatus
  beneficiaryId?: string
}) {
  try {
    const result = getDb().prepare(`UPDATE campaigns SET slug = ?, title = ?, summary = ?, description = ?, story = ?, category = ?, level = ?, location = ?, status = ?, target = ?, deadline = ?, video = ?, beneficiary_id = ?, seo_title = ?, seo_description = ? WHERE id = ?`).run(
      slugify(input.slug || input.title), input.title, input.summary, input.description, input.description, input.category, input.level, input.location, input.status, input.target, input.deadline, input.video || null, input.beneficiaryId || null, input.seoTitle || input.title, input.seoDescription || input.summary, campaignId,
    )
    missing(result, 'Campaign')
  } catch (error) {
    readable(error, 'The campaign could not be updated.')
  }
  audit('Campaign Manager', 'updated', 'Campaign', `Updated campaign "${input.title}"`)
  touch()
}

export async function deleteCampaign(campaignId: string) {
  const result = getDb().prepare('DELETE FROM campaigns WHERE id = ?').run(campaignId)
  missing(result, 'Campaign')
  audit('Campaign Manager', 'deleted', 'Campaign', `Removed campaign ${campaignId}`)
  touch()
}

export async function deleteBeneficiary(beneficiaryId: string) {
  const result = getDb().prepare('DELETE FROM beneficiaries WHERE id = ?').run(beneficiaryId)
  missing(result, 'Learner')
  audit('Campaign Manager', 'deleted', 'Beneficiary', `Removed learner ${beneficiaryId}`)
  touch()
}

export async function createAdminDonation(input: { donorName: string; email: string; amount: number; campaignId?: string; status: DonationStatus; message: string }) {
  if (!Number.isFinite(input.amount) || input.amount < 500) throw new Error('Enter an amount of at least 500 UGX.')
  const donationId = id('d')
  const reference = `ADM-${Date.now().toString(36).toUpperCase()}`
  const today = new Date().toISOString().slice(0, 10)
  const db = getDb()
  db.prepare(`INSERT INTO donations (id, donor_name, anonymous, email, phone, amount, frequency, campaign_id, beneficiary_id, support_target, method, transaction_id, date, status, message)
    VALUES (?, ?, 0, ?, '', ?, 'one-time', ?, NULL, ?, 'Recorded', ?, ?, ?, ?)`).run(
    donationId, input.donorName || 'Donor', input.email, input.amount, input.campaignId || null, input.campaignId ? 'campaign' : 'general', reference, today, input.status, input.message || null,
  )
  db.prepare('INSERT INTO transactions (id, donation_id, provider, reference, amount, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id('pt'), donationId, 'Recorded', reference, input.amount, input.status, today,
  )
  if (input.status === 'Successful') moveRaised({ id: donationId, amount: input.amount, campaign_id: input.campaignId || null, beneficiary_id: null, status: 'Pending' }, 'Successful')
  audit('Finance Admin', 'created', 'Donation', `Recorded gift ${reference}`)
  touch()
}

export async function setDonationStatus(donationId: string, status: DonationStatus) {
  const db = getDb()
  const row = db.prepare('SELECT id, amount, campaign_id, beneficiary_id, status FROM donations WHERE id = ?').get(donationId) as GiftRow | undefined
  if (!row) throw new Error('Gift was not found.')
  moveRaised(row, status)
  db.prepare('UPDATE donations SET status = ? WHERE id = ?').run(status, donationId)
  db.prepare('UPDATE transactions SET status = ? WHERE donation_id = ?').run(status, donationId)
  audit('Finance Admin', 'updated', 'Donation', `Set gift ${donationId} to ${status}`)
  touch()
}

export async function deleteAdminDonation(donationId: string) {
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
  const result = getDb().prepare('UPDATE stories SET title = ?, excerpt = ?, body = ?, category = ?, status = ? WHERE id = ?').run(
    input.title, input.body.slice(0, 140), input.body, input.category, input.status, storyId,
  )
  missing(result, 'Story')
  audit('Content Manager', 'updated', 'Story', `Updated story "${input.title}"`)
  touch()
}

export async function deleteStory(storyId: string) {
  const result = getDb().prepare('DELETE FROM stories WHERE id = ?').run(storyId)
  missing(result, 'Story')
  audit('Content Manager', 'deleted', 'Story', `Removed story ${storyId}`)
  touch()
}

export async function updateGalleryItem(itemId: string, input: { alt: string; caption: string; category: string; campaignId?: string; storyId?: string }) {
  const result = getDb().prepare('UPDATE gallery SET alt = ?, caption = ?, category = ?, campaign_id = ?, story_id = ? WHERE id = ?').run(
    input.alt, input.caption, input.category, input.campaignId || null, input.storyId || null, itemId,
  )
  missing(result, 'Photo')
  audit('Content Manager', 'updated', 'Gallery', `Updated photo ${itemId}`)
  touch()
}

export async function updateExpense(expenseId: string, input: Omit<Expense, 'id'>) {
  const result = getDb().prepare('UPDATE expenses SET date = ?, category = ?, campaign_id = ?, description = ?, amount = ?, supplier = ?, receipt = ?, status = ? WHERE id = ?').run(
    input.date, input.category, input.campaignId ?? null, input.description, input.amount, input.supplier, input.receipt, input.status, expenseId,
  )
  missing(result, 'Expense')
  audit('Finance Admin', 'updated', 'Expense', `Updated ${input.receipt || expenseId}`)
  touch()
}

export async function deleteExpense(expenseId: string) {
  const result = getDb().prepare('DELETE FROM expenses WHERE id = ?').run(expenseId)
  missing(result, 'Expense')
  audit('Finance Admin', 'deleted', 'Expense', `Removed expense ${expenseId}`)
  touch()
}

export async function savePartner(input: { id?: string; name: string; logoUrl?: string }) {
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
  const result = getDb().prepare('DELETE FROM partners WHERE id = ?').run(partnerId)
  missing(result, 'Partner')
  audit('Super Admin', 'deleted', 'Partner', `Removed partner ${partnerId}`)
  touch()
}

export async function saveVolunteer(input: { id?: string; name: string; email: string; phone: string; skills: string; interest: string; availability: string; message: string; status: Volunteer['status'] }) {
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
  const result = getDb().prepare('DELETE FROM volunteers WHERE id = ?').run(volunteerId)
  missing(result, 'Volunteer')
  audit('Super Admin', 'deleted', 'Volunteer', `Removed volunteer ${volunteerId}`)
  touch()
}

export async function saveUser(input: { id?: string; name: string; email: string; role: string; phone: string }) {
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
  const result = getDb().prepare('DELETE FROM users WHERE id = ?').run(userId)
  missing(result, 'User')
  audit('Super Admin', 'deleted', 'User', `Removed user ${userId}`)
  touch()
}

export async function saveNews(input: { id?: string; title: string; excerpt: string; body: string; category: string; date: string }) {
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
  const result = getDb().prepare('DELETE FROM news WHERE id = ?').run(articleId)
  missing(result, 'Article')
  audit('Content Manager', 'deleted', 'News', `Removed article ${articleId}`)
  touch()
}

export async function saveEvent(input: { id?: string; name: string; date: string; time: string; location: string; description: string }) {
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
  const result = getDb().prepare('DELETE FROM events WHERE id = ?').run(eventId)
  missing(result, 'Event')
  audit('Content Manager', 'deleted', 'Event', `Removed event ${eventId}`)
  touch()
}

export async function saveFaq(input: { id?: string; question: string; answer: string; topic: string }) {
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
  const result = getDb().prepare('DELETE FROM faqs WHERE id = ?').run(faqId)
  missing(result, 'Question')
  audit('Content Manager', 'deleted', 'FAQ', `Removed question ${faqId}`)
  touch()
}

export async function deleteAuditLog(logId: string) {
  const result = getDb().prepare('DELETE FROM audit_logs WHERE id = ?').run(logId)
  missing(result, 'Log entry')
  touch()
}
