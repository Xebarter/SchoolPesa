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
  const rows = getDb().prepare('SELECT id, title, body, date, read FROM notifications WHERE lower(email) = ? ORDER BY date DESC').all(matchEmail(email)) as Record<string, string | number>[]
  return rows.map((row) => ({ id: String(row.id), title: String(row.title), body: String(row.body ?? ''), date: String(row.date), read: Boolean(row.read) }))
}

export function donorEmailUpdates(email: string) {
  const row = getDb().prepare('SELECT email_updates FROM donor_settings WHERE lower(email) = ?').get(matchEmail(email)) as { email_updates: number } | undefined
  return row ? Boolean(row.email_updates) : true
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

export type DonorUpdate = { id: string; title: string; body: string; date: string }

export function donorUpdates(email: string): DonorUpdate[] {
  const rows = getDb().prepare('SELECT id, title, body, date FROM donor_updates WHERE lower(email) = ? ORDER BY date DESC').all(matchEmail(email)) as DonorUpdate[]
  return rows.map((row) => ({ id: row.id, title: row.title, body: row.body, date: row.date }))
}

export function donorStories(email: string): Story[] {
  const campaignIds = new Set(donorCampaigns(email).map((item) => item.id))
  const childIds = new Set(donorChildren(email).map((item) => item.id))
  return listStories().filter((story) => story.status === 'published' && ((story.campaignId && campaignIds.has(story.campaignId)) || (story.beneficiaryId && childIds.has(story.beneficiaryId))))
}

export function ownedDonation(email: string, id: string): Donation | undefined {
  return donorDonations(email).find((item) => item.id === id)
}
