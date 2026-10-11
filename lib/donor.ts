import { createAdminClient } from '@/lib/supabase/admin'
import { listBeneficiaries, listCampaigns, listDonations, listStories } from '@/lib/db'
import type { Beneficiary, Campaign, Donation, NotificationItem, Story } from '@/lib/types'

export function donorKey(email: string) {
  return email.trim().toLowerCase()
}

function matchEmail(email: string) {
  return donorKey(email)
}

export async function donorDonations(email: string) {
  const key = matchEmail(email)
  return (await listDonations()).filter((item) => donorKey(item.email) === key)
}

export async function donorNotifications(email: string): Promise<NotificationItem[]> {
  const { data, error } = await createAdminClient().from('notifications')
    .select('id, title, body, date, read, kind, href, created_at')
    .ilike('email', matchEmail(email))
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Could not load donor notifications: ${error.message}`)
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body ?? '',
    date: row.date,
    read: row.read,
    kind: row.kind ?? 'system',
    href: row.href ?? undefined,
    createdAt: row.created_at ?? undefined,
  }))
}

export type UpdateCadence = 'instant' | 'weekly' | 'off'

export type DonorPreferences = {
  updateCadence: UpdateCadence
  receiptEmails: boolean
  digest: boolean
  productNews: boolean
  anonymousDefault: boolean
  publicRecognition: boolean
}

const preferenceDefaults: DonorPreferences = {
  updateCadence: 'instant',
  receiptEmails: true,
  digest: true,
  productNews: false,
  anonymousDefault: true,
  publicRecognition: false,
}

type PreferenceRow = {
  email_updates: boolean
  receipt_emails: boolean
  digest: boolean
  product_news: boolean
  anonymous_default: boolean
  public_recognition: boolean
  update_cadence: string
}

function cadenceOf(value: string, emailUpdates: boolean): UpdateCadence {
  if (!emailUpdates) return 'off'
  if (value === 'weekly' || value === 'off' || value === 'instant') return value
  return 'instant'
}

export async function donorPreferences(email: string): Promise<DonorPreferences> {
  const key = matchEmail(email)
  const db = createAdminClient()
  const { data: row, error } = await db.from('donor_settings')
    .select('email_updates, receipt_emails, digest, product_news, anonymous_default, public_recognition, update_cadence')
    .ilike('email', key)
    .maybeSingle()
  if (error) throw new Error(`Could not load donor preferences: ${error.message}`)
  if (!row) {
    const { data: subscribed, error: newsletterError } = await db.from('newsletter').select('id').ilike('email', key).maybeSingle()
    if (newsletterError) throw new Error(`Could not load newsletter preference: ${newsletterError.message}`)
    return { ...preferenceDefaults, productNews: Boolean(subscribed) }
  }
  return {
    updateCadence: cadenceOf(row.update_cadence, row.email_updates),
    receiptEmails: Boolean(row.receipt_emails),
    digest: Boolean(row.digest),
    productNews: Boolean(row.product_news),
    anonymousDefault: Boolean(row.anonymous_default),
    publicRecognition: Boolean(row.public_recognition),
  }
}

export async function donorEmailUpdates(email: string) {
  return (await donorPreferences(email)).updateCadence !== 'off'
}

export type LinkedCampaign = Campaign & { note: string }

export async function donorCampaigns(email: string): Promise<LinkedCampaign[]> {
  const key = matchEmail(email)
  const db = createAdminClient()
  const [{ data: links, error: linksError }, campaigns, gifts] = await Promise.all([
    db.from('campaign_links').select('campaign_id, note, hidden').ilike('email', key),
    listCampaigns(),
    donorDonations(email),
  ])
  if (linksError) throw new Error(`Could not load followed campaigns: ${linksError.message}`)
  const followed = links ?? []
  const hidden = new Set(followed.filter((item) => item.hidden).map((item) => item.campaign_id))
  const notes = new Map(followed.map((item) => [item.campaign_id, item.note]))
  const ids = new Set<string>([
    ...gifts.map((item) => item.campaignId).filter((id): id is string => Boolean(id)),
    ...followed.filter((item) => !item.hidden).map((item) => item.campaign_id),
  ])
  return campaigns
    .filter((item) => ids.has(item.id) && !hidden.has(item.id))
    .map((item) => ({ ...item, note: notes.get(item.id) ?? '' }))
}

export type LinkedChild = Beneficiary & { note: string }

export async function donorChildren(email: string): Promise<LinkedChild[]> {
  const key = matchEmail(email)
  const db = createAdminClient()
  const [{ data: links, error: linksError }, beneficiaries, donations] = await Promise.all([
    db.from('sponsorships').select('beneficiary_id, note, hidden').ilike('email', key),
    listBeneficiaries(),
    donorDonations(email),
  ])
  if (linksError) throw new Error(`Could not load learner sponsorships: ${linksError.message}`)
  const followed = links ?? []
  const hidden = new Set(followed.filter((item) => item.hidden).map((item) => item.beneficiary_id))
  const notes = new Map(followed.map((item) => [item.beneficiary_id, item.note]))
  const ids = new Set<string>([
    ...donations.map((item) => item.beneficiaryId).filter((id): id is string => Boolean(id)),
    ...followed.filter((item) => !item.hidden).map((item) => item.beneficiary_id),
  ])
  return beneficiaries
    .filter((item) => ids.has(item.id) && !hidden.has(item.id))
    .map((item) => ({ ...item, note: notes.get(item.id) ?? '' }))
}

export type UpdateStatus = 'draft' | 'submitted' | 'changes' | 'published' | 'declined'

export type DonorUpdate = {
  id: string
  email: string
  title: string
  body: string
  date: string
  status: UpdateStatus
  campaignId?: string
  beneficiaryId?: string
  reviewNote: string
  storyId?: string
  storySlug?: string
  category: string
}

type UpdateRow = {
  id: string
  email: string
  title: string
  body: string
  date: string
  status: string
  campaign_id: string | null
  beneficiary_id: string | null
  review_note: string
  story_id: string | null
  category: string
  story_slug: string | null
}

function mapUpdate(row: UpdateRow): DonorUpdate {
  return {
    id: row.id,
    email: row.email,
    title: row.title,
    body: row.body,
    date: row.date,
    status: (row.status || 'draft') as UpdateStatus,
    campaignId: row.campaign_id || undefined,
    beneficiaryId: row.beneficiary_id || undefined,
    reviewNote: row.review_note || '',
    storyId: row.story_id || undefined,
    storySlug: row.story_slug || undefined,
    category: row.category || 'Success Stories',
  }
}

async function joinedUpdates(rows: Omit<UpdateRow, 'story_slug'>[]): Promise<DonorUpdate[]> {
  const ids = rows.map((row) => row.story_id).filter((id): id is string => Boolean(id))
  const { data: stories, error } = ids.length
    ? await createAdminClient().from('stories').select('id, slug').in('id', ids)
    : { data: [], error: null }
  if (error) throw new Error(`Could not load update stories: ${error.message}`)
  const slugs = new Map((stories ?? []).map((story) => [story.id, story.slug]))
  return rows.map((row) => mapUpdate({ ...row, story_slug: row.story_id ? slugs.get(row.story_id) ?? null : null }))
}

export async function donorUpdates(email: string): Promise<DonorUpdate[]> {
  const { data, error } = await createAdminClient().from('donor_updates').select('*')
    .ilike('email', matchEmail(email))
    .order('date', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw new Error(`Could not load donor updates: ${error.message}`)
  return joinedUpdates((data ?? []) as Omit<UpdateRow, 'story_slug'>[])
}

export async function listImpactUpdates(): Promise<DonorUpdate[]> {
  const { data, error } = await createAdminClient().from('donor_updates').select('*').order('date', { ascending: false })
  if (error) throw new Error(`Could not load impact updates: ${error.message}`)
  const priority: Record<string, number> = { submitted: 0, changes: 1, published: 2, declined: 3, draft: 4 }
  const ordered = (data ?? []).sort((a, b) => (priority[a.status] ?? 4) - (priority[b.status] ?? 4))
  return joinedUpdates(ordered as Omit<UpdateRow, 'story_slug'>[])
}

export async function impactUpdatesInReview() {
  const { count, error } = await createAdminClient().from('donor_updates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'submitted')
  if (error) throw new Error(`Could not count impact updates in review: ${error.message}`)
  return count ?? 0
}

export async function donorStories(email: string): Promise<Story[]> {
  const [campaigns, children, stories] = await Promise.all([donorCampaigns(email), donorChildren(email), listStories()])
  const campaignIds = new Set(campaigns.map((item) => item.id))
  const childIds = new Set(children.map((item) => item.id))
  return stories.filter((story) => story.status === 'published' && ((story.campaignId && campaignIds.has(story.campaignId)) || (story.beneficiaryId && childIds.has(story.beneficiaryId))))
}

export async function ownedDonation(email: string, id: string): Promise<Donation | undefined> {
  return (await donorDonations(email)).find((item) => item.id === id)
}
