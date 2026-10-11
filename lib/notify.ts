import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { donorKey, donorPreferences } from '@/lib/donor'

export type AlertKind = 'gift' | 'campaign' | 'learner' | 'update' | 'reminder' | 'system'

export async function alertDonor(email: string, input: { title: string; body: string; kind?: AlertKind; href?: string }) {
  const key = donorKey(email)
  if (!key || key === 'gifts@schoolpesa.example') return
  const now = new Date()
  const { error } = await createAdminClient().from('notifications').insert({
    id: `nt-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title,
    body: input.body,
    date: now.toISOString().slice(0, 10),
    read: false,
    email: key,
    kind: input.kind ?? 'system',
    href: input.href ?? '/dashboard/notifications',
    created_at: now.toISOString(),
  })
  if (error) throw new Error(`Could not save donor notification: ${error.message}`)
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/notifications')
}

export async function alertFollowers(input: { campaignId?: string | null; beneficiaryId?: string | null; title: string; body: string; href?: string; exceptEmail?: string }) {
  const db = createAdminClient()
  const emails = new Set<string>()
  if (input.campaignId) {
    const [{ data: links, error: linksError }, { data: gifts, error: giftsError }] = await Promise.all([
      db.from('campaign_links').select('email').eq('campaign_id', input.campaignId).eq('hidden', false),
      db.from('donations').select('email').eq('campaign_id', input.campaignId).neq('email', ''),
    ])
    if (linksError) throw new Error(`Could not find campaign followers: ${linksError.message}`)
    if (giftsError) throw new Error(`Could not find campaign donors: ${giftsError.message}`)
    for (const row of [...(links ?? []), ...(gifts ?? [])]) emails.add(donorKey(row.email))
  }
  if (input.beneficiaryId) {
    const [{ data: links, error: linksError }, { data: gifts, error: giftsError }] = await Promise.all([
      db.from('sponsorships').select('email').eq('beneficiary_id', input.beneficiaryId).eq('hidden', false),
      db.from('donations').select('email').eq('beneficiary_id', input.beneficiaryId).neq('email', ''),
    ])
    if (linksError) throw new Error(`Could not find learner sponsors: ${linksError.message}`)
    if (giftsError) throw new Error(`Could not find learner donors: ${giftsError.message}`)
    for (const row of [...(links ?? []), ...(gifts ?? [])]) emails.add(donorKey(row.email))
  }
  const skip = input.exceptEmail ? donorKey(input.exceptEmail) : ''
  await Promise.all([...emails].filter((email) => email && email !== skip).map(async (email) => {
    if ((await donorPreferences(email)).updateCadence === 'off') return
    await alertDonor(email, { title: input.title, body: input.body, kind: 'update', href: input.href ?? '/dashboard/updates' })
  }))
}
