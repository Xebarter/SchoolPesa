import { getDb, listBeneficiaries, listCampaigns, listDonations, listStories } from '@/lib/db'
import type { Beneficiary, Campaign, Donation, NotificationItem, Story } from '@/lib/types'

export function donorKey(email: string) {
  return email.trim().toLowerCase()
}

function matchEmail(email: string) {
  return donorKey(email)
}

export function donorDonations(email: string) {
  const key = matchEmail(email)
  return listDonations().filter((item) => donorKey(item.email) === key)
}

export function donorNotifications(email: string): NotificationItem[] {
  const rows = getDb().prepare('SELECT id, title, body, date, read, kind, href, created_at FROM notifications WHERE lower(email) = ? ORDER BY COALESCE(created_at, date) DESC').all(matchEmail(email)) as Record<string, string | number | null>[]
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ''),
    date: String(row.date),
    read: Boolean(row.read),
    kind: row.kind ? String(row.kind) : 'system',
    href: row.href ? String(row.href) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
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
  email_updates: number
  receipt_emails: number
  digest: number
  product_news: number
  anonymous_default: number
  public_recognition: number
  update_cadence: string
}

function cadenceOf(value: string, emailUpdates: number): UpdateCadence {
  if (!emailUpdates) return 'off'
  if (value === 'weekly' || value === 'off' || value === 'instant') return value
  return 'instant'
}

export function donorPreferences(email: string): DonorPreferences {
  const key = matchEmail(email)
  const row = getDb().prepare(`SELECT email_updates, receipt_emails, digest, product_news, anonymous_default, public_recognition, update_cadence
    FROM donor_settings WHERE lower(email) = ?`).get(key) as PreferenceRow | undefined
  if (!row) {
    const subscribed = getDb().prepare('SELECT 1 AS n FROM newsletter WHERE lower(email) = ?').get(key)
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

export function donorEmailUpdates(email: string) {
  return donorPreferences(email).updateCadence !== 'off'
}

export type LinkedCampaign = Campaign & { note: string }

export function donorCampaigns(email: string): LinkedCampaign[] {
  const key = matchEmail(email)
  const donations = donorDonations(email)
  const links = getDb().prepare('SELECT campaign_id, note, hidden FROM campaign_links WHERE lower(email) = ?').all(key) as { campaign_id: string; note: string; hidden: number }[]
  const hidden = new Set(links.filter((item) => item.hidden).map((item) => item.campaign_id))
  const notes = new Map(links.map((item) => [item.campaign_id, item.note]))
  const ids = new Set<string>([
    ...donations.map((item) => item.campaignId).filter((id): id is string => Boolean(id)),
    ...links.filter((item) => !item.hidden).map((item) => item.campaign_id),
  ])
  return listCampaigns()
    .filter((item) => ids.has(item.id) && !hidden.has(item.id))
    .map((item) => ({ ...item, note: notes.get(item.id) ?? '' }))
}

export type LinkedChild = Beneficiary & { note: string }

export function donorChildren(email: string): LinkedChild[] {
  const key = matchEmail(email)
  const donations = donorDonations(email)
  const links = getDb().prepare('SELECT beneficiary_id, note, hidden FROM sponsorships WHERE lower(email) = ?').all(key) as { beneficiary_id: string; note: string; hidden: number }[]
  const hidden = new Set(links.filter((item) => item.hidden).map((item) => item.beneficiary_id))
  const notes = new Map(links.map((item) => [item.beneficiary_id, item.note]))
  const ids = new Set<string>([
    ...donations.map((item) => item.beneficiaryId).filter((id): id is string => Boolean(id)),
    ...links.filter((item) => !item.hidden).map((item) => item.beneficiary_id),
  ])
  return listBeneficiaries()
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

const updateSelect = `SELECT u.id, u.email, u.title, u.body, u.date, u.status, u.campaign_id, u.beneficiary_id, u.review_note, u.story_id, u.category, s.slug AS story_slug
  FROM donor_updates u LEFT JOIN stories s ON s.id = u.story_id`

export function donorUpdates(email: string): DonorUpdate[] {
  const rows = getDb().prepare(`${updateSelect} WHERE lower(u.email) = ? ORDER BY u.date DESC, u.id DESC`).all(matchEmail(email)) as UpdateRow[]
  return rows.map(mapUpdate)
}

export function listImpactUpdates(): DonorUpdate[] {
  const rows = getDb().prepare(`${updateSelect} ORDER BY CASE u.status WHEN 'submitted' THEN 0 WHEN 'changes' THEN 1 WHEN 'published' THEN 2 WHEN 'declined' THEN 3 ELSE 4 END, u.date DESC`).all() as UpdateRow[]
  return rows.map(mapUpdate)
}

export function impactUpdatesInReview() {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM donor_updates WHERE status = 'submitted'").get() as { n: number }
  return Number(row.n)
}

export function donorStories(email: string): Story[] {
  const campaignIds = new Set(donorCampaigns(email).map((item) => item.id))
  const childIds = new Set(donorChildren(email).map((item) => item.id))
  return listStories().filter((story) => story.status === 'published' && ((story.campaignId && campaignIds.has(story.campaignId)) || (story.beneficiaryId && childIds.has(story.beneficiaryId))))
}

export function ownedDonation(email: string, id: string): Donation | undefined {
  return donorDonations(email).find((item) => item.id === id)
}
