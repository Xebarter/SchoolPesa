'use server'

import { revalidatePath } from 'next/cache'
import { getDb, syncCampaignImpact } from '@/lib/db'
import { galleryPhoto, photoUses, removeGalleryObject } from '@/lib/gallery-images'
import { assertAdmin } from '@/lib/supabase/session'
import type { CampaignStatus, CheckoutDraft, Expense, GalleryItem, Story, Volunteer } from '@/lib/types'

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
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

export async function recordDonation(draft: CheckoutDraft, reference: string) {
  const donationId = id('d')
  const today = new Date().toISOString().slice(0, 10)
  const db = getDb()
  await result(db.from('donations').insert({
    id: donationId, donor_name: draft.anonymous ? 'Anonymous' : draft.name, anonymous: draft.anonymous,
    email: draft.email, phone: draft.phone, amount: draft.amount, frequency: draft.frequency,
    campaign_id: draft.campaignId ?? null, beneficiary_id: draft.beneficiaryId ?? null,
    support_target: draft.supportTarget, method: 'Prepared checkout', transaction_id: reference,
    date: today, status: 'Pending', message: draft.message || null,
  }), 'record donation')
  await result(db.from('transactions').insert({
    id: id('pt'), donation_id: donationId, provider: 'Payment provider', reference,
    amount: draft.amount, status: 'Pending', date: today,
  }), 'record donation transaction')
  await result(db.from('notifications').insert({
    id: id('nt'), title: 'Gift prepared',
    body: `${draft.anonymous ? 'A donor' : draft.name} prepared ${draft.amount} UGX. Reference ${reference}.`,
    date: today, read: false,
  }), 'create donation notification')
  await audit(draft.name || 'Donor', 'prepared', 'Donation', `Prepared gift ${reference}`)
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  revalidatePath('/admin/donations')
  revalidatePath('/impact')
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function galleryJson(value?: string) {
  const items = (value ?? '').split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
  return JSON.stringify(items)
}

function readable(error: unknown, fallback: string): never {
  const message = error instanceof Error ? error.message : fallback
  if (/UNIQUE/i.test(message)) throw new Error('A campaign with that address already exists.')
  throw error instanceof Error ? error : new Error(fallback)
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
  const campaignId = id('camp')
  const slug = slugify(input.slug || title) || `campaign-${campaignId.slice(-4)}`
  try {
    await result(getDb().from('campaigns').insert({
      id: campaignId, slug, title, summary: input.summary.trim(), description: input.description.trim(),
      story: input.description.trim(), category: input.category.trim() || 'School Fees', level: input.level,
      location: input.location.trim(), status: input.status, target, raised: 0, donors: 0,
      deadline: input.deadline, created_at: input.createdAt || new Date().toISOString().slice(0, 10),
      image: input.image?.trim() || '/school-pesa-hero.png', gallery: JSON.parse(galleryJson(input.gallery)),
      video: input.video?.trim() || null, beneficiary_id: input.beneficiaryId || null,
      seo_title: input.seoTitle.trim() || title, seo_description: input.seoDescription.trim() || input.summary.trim(),
      updates: [],
    }), 'create campaign')
  } catch (error) {
    readable(error, 'The campaign could not be created.')
  }
  await syncCampaignImpact()
  await audit('Campaign Manager', 'created', 'Campaign', `Created campaign "${title}"`)
  revalidatePath('/campaigns')
  revalidatePath('/campaigns/[slug]', 'page')
  revalidatePath('/admin')
  revalidatePath('/admin/campaigns')
  revalidatePath('/donate')
}

export async function updateCampaignStatus(campaignId: string, status: CampaignStatus) {
  await assertAdmin()
  const updated = await result(getDb().from('campaigns').update({ status }).eq('id', campaignId).select('id'), 'update campaign')
  if (!updated?.length) throw new Error('Campaign was not found.')
  await syncCampaignImpact()
  await audit('Campaign Manager', 'updated', 'Campaign', `Set campaign ${campaignId} to ${status}`)
  revalidatePath('/campaigns')
  revalidatePath('/campaigns/[slug]', 'page')
  revalidatePath('/admin')
  revalidatePath('/admin/campaigns')
  revalidatePath('/donate')
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
  await assertAdmin()
  const story = input.story ?? input.needs
  const profile = input.publicProfile === false ? 0 : 1
  const image = input.publicImage ? 1 : 0
  const visible = input.storyVisible === false ? 0 : 1
  const status = input.status || 'active'
  if (input.id) {
    const updated = await result(getDb().from('beneficiaries').update({
      display_name: input.displayName, level: input.level, school: input.school, location: input.location,
      story, needs: input.needs, target: input.target, public_profile: Boolean(profile),
      public_image: Boolean(image), story_visible: Boolean(visible), status,
    }).eq('id', input.id).select('id'), 'update learner')
    if (!updated?.length) throw new Error('Learner was not found.')
  } else {
    await result(getDb().from('beneficiaries').insert({
      id: id('ben'), display_name: input.displayName, level: input.level, school: input.school,
      location: input.location, story, needs: input.needs, target: input.target, raised: 0,
      image: '/school-pesa-hero.png', public_profile: Boolean(profile), public_image: Boolean(image),
      story_visible: Boolean(visible), status, updates: [],
    }), 'create learner')
  }
  revalidatePath('/sponsor')
  revalidatePath('/admin/beneficiaries')
}

export async function createStory(input: { title: string; body: string; category: string; status: Story['status'] }) {
  await assertAdmin()
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || id('story')
  const today = new Date().toISOString().slice(0, 10)
  await result(getDb().from('stories').insert({
    id: id('st'), slug, title: input.title, excerpt: input.body.slice(0, 140), body: input.body,
    category: input.category, author: 'School Pesa', date: today, image: '/school-pesa-hero.png',
    gallery: [], campaign_id: null, beneficiary_id: null, status: input.status, views: 0,
  }), 'create story')
  await audit('Content Manager', 'created', 'Story', `Saved story "${input.title}"`)
  revalidatePath('/stories')
  revalidatePath('/admin/stories')
}

export async function toggleStoryStatus(storyId: string, status: Story['status']) {
  await assertAdmin()
  const updated = await result(getDb().from('stories').update({ status }).eq('id', storyId).select('id'), 'update story status')
  if (!updated?.length) throw new Error('Story was not found.')
  revalidatePath('/stories')
  revalidatePath('/admin/stories')
}

export async function createExpense(input: Omit<Expense, 'id' | 'status'> & { status?: Expense['status'] }) {
  await assertAdmin()
  await result(getDb().from('expenses').insert({
    id: id('x'), date: input.date, category: input.category, campaign_id: input.campaignId ?? null,
    description: input.description, amount: input.amount, supplier: input.supplier, receipt: input.receipt,
    status: input.status ?? 'recorded',
  }), 'create expense')
  await audit('Finance Admin', 'recorded', 'Expense', `Recorded ${input.receipt}`)
  revalidatePath('/admin/finance')
}

export async function createGalleryItem(input: Omit<GalleryItem, 'id' | 'src'>) {
  await assertAdmin()
  await result(getDb().from('gallery').insert({
    id: id('g'), src: '/school-pesa-hero.png', alt: input.alt, caption: input.caption,
    category: input.category, campaign_id: input.campaignId ?? null, story_id: input.storyId ?? null,
  }), 'create gallery photo')
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
}

export async function deleteGalleryItem(itemId: string) {
  await assertAdmin()
  const photo = await galleryPhoto(itemId)
  if (!photo) throw new Error('Photo was not found.')
  const uses = await photoUses(photo)
  if (uses.length) {
    const preview = uses.slice(0, 3).join(', ')
    const more = uses.length > 3 ? ` and ${uses.length - 3} more` : ''
    throw new Error(`This photo is used on ${preview}${more}. Replace it instead of deleting it.`)
  }
  const deleted = await result(getDb().from('gallery').delete().eq('id', itemId).select('id'), 'delete gallery photo')
  if (!deleted?.length) throw new Error('Photo was not found.')
  const stillUsed = await result(getDb().from('gallery').select('id').eq('src', photo.src).limit(1), 'check remaining gallery photo references')
  if (!stillUsed?.length) await removeGalleryObject(photo.src)
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
}

export async function submitVolunteer(input: Omit<Volunteer, 'id' | 'status'>) {
  await result(getDb().from('volunteers').insert({
    id: id('v'), name: input.name, email: input.email, phone: input.phone, skills: input.skills,
    interest: input.interest, availability: input.availability, message: input.message, status: 'new',
  }), 'submit volunteer application')
  revalidatePath('/admin/people')
}

export async function submitContact(input: { name: string; email: string; message: string }) {
  await result(getDb().from('contacts').insert({ id: id('c'), name: input.name, email: input.email, message: input.message }), 'submit contact message')
}

export async function joinNewsletter(email: string) {
  await result(getDb().from('newsletter').upsert({ id: id('n'), email }, { onConflict: 'email', ignoreDuplicates: true }), 'join newsletter')
}

export async function registerForEvent(eventName: string) {
  await result(getDb().from('event_registrations').insert({ id: id('er'), event_name: eventName }), 'register for event')
}

export async function saveSettings(values: Record<string, string>) {
  await assertAdmin()
  for (const [key, value] of Object.entries(values)) {
    await result(getDb().from('settings').upsert({ key, value }, { onConflict: 'key' }), `save setting "${key}"`)
  }
  await audit('Super Admin', 'updated', 'Settings', 'Updated organization settings')
  revalidatePath('/admin/settings')
}

export async function saveDonorProfile(input: { name: string; email: string; phone: string }) {
  const existing = await result(getDb().from('users').select('id').eq('email', input.email).maybeSingle(), 'find donor profile')
  if (existing) {
    await result(getDb().from('users').update({ name: input.name, phone: input.phone }).eq('id', existing.id), 'update donor profile')
  } else {
    await result(getDb().from('users').insert({ id: id('u'), name: input.name, email: input.email, role: 'Viewer', phone: input.phone }), 'create donor profile')
  }
  revalidatePath('/dashboard/profile')
  revalidatePath('/admin/users')
}

export async function ensureDonor(input: { name: string; email: string }) {
  const existing = await result(getDb().from('users').select('id').eq('email', input.email).maybeSingle(), 'check donor account')
  if (existing) return
  await result(getDb().from('users').insert({ id: id('u'), name: input.name || 'Donor', email: input.email, role: 'Viewer', phone: null }), 'create donor account')
  revalidatePath('/admin/users')
}
