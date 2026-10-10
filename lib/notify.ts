import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { donorKey, donorPreferences } from '@/lib/donor'

export type AlertKind = 'gift' | 'campaign' | 'learner' | 'update' | 'reminder' | 'system'

export function alertDonor(email: string, input: { title: string; body: string; kind?: AlertKind; href?: string }) {
  const key = donorKey(email)
  if (!key || key === 'gifts@schoolpesa.example') return
  const now = new Date()
  getDb().prepare('INSERT INTO notifications (id, title, body, date, read, email, kind, href, created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)').run(
    `nt-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    input.title,
    input.body,
    now.toISOString().slice(0, 10),
    key,
    input.kind ?? 'system',
    input.href ?? '/dashboard/notifications',
    now.toISOString(),
  )
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/notifications')
}

export function alertFollowers(input: { campaignId?: string | null; beneficiaryId?: string | null; title: string; body: string; href?: string; exceptEmail?: string }) {
  const db = getDb()
  const emails = new Set<string>()
  if (input.campaignId) {
    const links = db.prepare('SELECT email FROM campaign_links WHERE campaign_id = ? AND hidden = 0').all(input.campaignId) as { email: string }[]
    const gifts = db.prepare("SELECT DISTINCT email FROM donations WHERE campaign_id = ? AND email != ''").all(input.campaignId) as { email: string }[]
    for (const row of [...links, ...gifts]) emails.add(donorKey(row.email))
  }
  if (input.beneficiaryId) {
    const links = db.prepare('SELECT email FROM sponsorships WHERE beneficiary_id = ? AND hidden = 0').all(input.beneficiaryId) as { email: string }[]
    const gifts = db.prepare("SELECT DISTINCT email FROM donations WHERE beneficiary_id = ? AND email != ''").all(input.beneficiaryId) as { email: string }[]
    for (const row of [...links, ...gifts]) emails.add(donorKey(row.email))
  }
  const skip = input.exceptEmail ? donorKey(input.exceptEmail) : ''
  for (const email of emails) {
    if (!email || email === skip) continue
    if (donorPreferences(email).updateCadence === 'off') continue
    alertDonor(email, { title: input.title, body: input.body, kind: 'update', href: input.href ?? '/dashboard/updates' })
  }
}
