'use server'

import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import type { CampaignStatus, CheckoutDraft, Expense, GalleryItem, Story, Volunteer } from '@/lib/types'

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
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

export async function recordDonation(draft: CheckoutDraft, reference: string) {
  const donationId = id('d')
  const today = new Date().toISOString().slice(0, 10)
  const db = getDb()
  db.prepare(`INSERT INTO donations (id, donor_name, anonymous, email, phone, amount, frequency, campaign_id, beneficiary_id, support_target, method, transaction_id, date, status, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    donationId,
    draft.anonymous ? 'Anonymous' : draft.name,
    draft.anonymous ? 1 : 0,
    draft.email,
    draft.phone,
    draft.amount,
    draft.frequency,
    draft.campaignId ?? null,
    draft.beneficiaryId ?? null,
    draft.supportTarget,
    'Prepared checkout',
    reference,
    today,
    'Pending',
    draft.message || null,
  )
  db.prepare('INSERT INTO transactions (id, donation_id, provider, reference, amount, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id('pt'), donationId, 'Payment provider', reference, draft.amount, 'Pending', today,
  )
  db.prepare('INSERT INTO notifications (id, title, body, date, read) VALUES (?, ?, ?, ?, 0)').run(
    id('nt'),
    'Gift prepared',
    `${draft.anonymous ? 'A donor' : draft.name} prepared ${draft.amount} UGX. Reference ${reference}.`,
    today,
  )
  audit(draft.name || 'Donor', 'prepared', 'Donation', `Prepared gift ${reference}`)
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  revalidatePath('/admin/donations')
  revalidatePath('/impact')
}

export async function createCampaign(input: {
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
  const campaignId = id('camp')
  const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  getDb().prepare(`INSERT INTO campaigns (id, slug, title, summary, description, story, category, level, location, status, target, raised, donors, deadline, created_at, image, gallery, video, beneficiary_id, seo_title, seo_description, updates)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, '/school-pesa-hero.png', '[]', ?, ?, ?, ?, '[]')`).run(
    campaignId, slug, input.title || 'Untitled campaign', input.summary, input.description, input.description, input.category, input.level, input.location, input.status, input.target, input.deadline, new Date().toISOString().slice(0, 10), input.video || null, input.beneficiaryId || null, input.seoTitle || input.title, input.seoDescription || input.summary,
  )
  audit('Campaign Manager', 'created', 'Campaign', `Created campaign "${input.title}"`)
  revalidatePath('/campaigns')
  revalidatePath('/admin/campaigns')
}

export async function updateCampaignStatus(campaignId: string, status: CampaignStatus) {
  getDb().prepare('UPDATE campaigns SET status = ? WHERE id = ?').run(status, campaignId)
  revalidatePath('/campaigns')
  revalidatePath('/admin/campaigns')
}

export async function saveBeneficiary(input: {
  id?: string
  displayName: string
  level: string
  school: string
  location: string
  needs: string
  target: number
  story?: string
  publicProfile?: boolean
  publicImage?: boolean
  storyVisible?: boolean
  status?: string
}) {
  const db = getDb()
  const story = input.story ?? input.needs
  const profile = input.publicProfile === false ? 0 : 1
  const image = input.publicImage ? 1 : 0
  const visible = input.storyVisible === false ? 0 : 1
  const status = input.status || 'active'
  if (input.id) {
    const result = db.prepare('UPDATE beneficiaries SET display_name = ?, level = ?, school = ?, location = ?, story = ?, needs = ?, target = ?, public_profile = ?, public_image = ?, story_visible = ?, status = ? WHERE id = ?').run(
      input.displayName, input.level, input.school, input.location, story, input.needs, input.target, profile, image, visible, status, input.id,
    )
    if (Number(result.changes) === 0) throw new Error('Learner was not found.')
  } else {
    db.prepare(`INSERT INTO beneficiaries (id, display_name, level, school, location, story, needs, target, raised, image, public_profile, public_image, story_visible, status, updates)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '/school-pesa-hero.png', ?, ?, ?, ?, '[]')`).run(
      id('ben'), input.displayName, input.level, input.school, input.location, story, input.needs, input.target, profile, image, visible, status,
    )
  }
  revalidatePath('/sponsor')
  revalidatePath('/admin/beneficiaries')
}

export async function createStory(input: { title: string; body: string; category: string; status: Story['status'] }) {
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || id('story')
  const today = new Date().toISOString().slice(0, 10)
  getDb().prepare(`INSERT INTO stories (id, slug, title, excerpt, body, category, author, date, image, gallery, campaign_id, beneficiary_id, status, views)
    VALUES (?, ?, ?, ?, ?, ?, 'School Pesa', ?, '/school-pesa-hero.png', '[]', NULL, NULL, ?, 0)`).run(
    id('st'), slug, input.title, input.body.slice(0, 140), input.body, input.category, today, input.status,
  )
  audit('Content Manager', 'created', 'Story', `Saved story "${input.title}"`)
  revalidatePath('/stories')
  revalidatePath('/admin/stories')
}

export async function toggleStoryStatus(storyId: string, status: Story['status']) {
  getDb().prepare('UPDATE stories SET status = ? WHERE id = ?').run(status, storyId)
  revalidatePath('/stories')
  revalidatePath('/admin/stories')
}

export async function createExpense(input: Omit<Expense, 'id' | 'status'> & { status?: Expense['status'] }) {
  getDb().prepare('INSERT INTO expenses (id, date, category, campaign_id, description, amount, supplier, receipt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id('x'), input.date, input.category, input.campaignId ?? null, input.description, input.amount, input.supplier, input.receipt, input.status ?? 'recorded',
  )
  audit('Finance Admin', 'recorded', 'Expense', `Recorded ${input.receipt}`)
  revalidatePath('/admin/finance')
}

export async function createGalleryItem(input: Omit<GalleryItem, 'id' | 'src'>) {
  getDb().prepare('INSERT INTO gallery (id, src, alt, caption, category, campaign_id, story_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id('g'), '/school-pesa-hero.png', input.alt, input.caption, input.category, input.campaignId ?? null, input.storyId ?? null,
  )
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
}

export async function deleteGalleryItem(itemId: string) {
  getDb().prepare('DELETE FROM gallery WHERE id = ?').run(itemId)
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
}

export async function submitVolunteer(input: Omit<Volunteer, 'id' | 'status'>) {
  getDb().prepare('INSERT INTO volunteers (id, name, email, phone, skills, interest, availability, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id('v'), input.name, input.email, input.phone, input.skills, input.interest, input.availability, input.message, 'new',
  )
  revalidatePath('/admin/people')
}

export async function submitContact(input: { name: string; email: string; message: string }) {
  getDb().prepare('INSERT INTO contacts (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id('c'), input.name, input.email, input.message, new Date().toISOString(),
  )
}

export async function joinNewsletter(email: string) {
  getDb().prepare('INSERT OR IGNORE INTO newsletter (id, email, created_at) VALUES (?, ?, ?)').run(id('n'), email, new Date().toISOString())
}

export async function registerForEvent(eventName: string) {
  getDb().prepare('INSERT INTO event_registrations (id, event_name, created_at) VALUES (?, ?, ?)').run(id('er'), eventName, new Date().toISOString())
}

export async function saveSettings(values: Record<string, string>) {
  const statement = getDb().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
  for (const [key, value] of Object.entries(values)) statement.run(key, value)
  audit('Super Admin', 'updated', 'Settings', 'Updated organization settings')
  revalidatePath('/admin/settings')
}

export async function saveDonorProfile(input: { name: string; email: string; phone: string }) {
  const existing = getDb().prepare('SELECT id FROM users WHERE email = ?').get(input.email) as { id: string } | undefined
  if (existing) {
    getDb().prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(input.name, input.phone, existing.id)
  } else {
    getDb().prepare('INSERT INTO users (id, name, email, role, phone) VALUES (?, ?, ?, ?, ?)').run(id('u'), input.name, input.email, 'Viewer', input.phone)
  }
  revalidatePath('/dashboard/profile')
  revalidatePath('/admin/users')
}

export async function ensureDonor(input: { name: string; email: string }) {
  const existing = getDb().prepare('SELECT id FROM users WHERE email = ?').get(input.email) as { id: string } | undefined
  if (existing) return
  getDb().prepare('INSERT INTO users (id, name, email, role, phone) VALUES (?, ?, ?, ?, NULL)').run(id('u'), input.name || 'Donor', input.email, 'Viewer')
  revalidatePath('/admin/users')
}
