'use server'

import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { donorKey, ownedDonation } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

function refresh() {
  for (const path of ['/dashboard', '/dashboard/donations', '/dashboard/receipts', '/dashboard/campaigns', '/dashboard/sponsored', '/dashboard/updates', '/dashboard/notifications', '/dashboard/settings', '/dashboard/profile']) {
    revalidatePath(path)
  }
}

async function donorEmail() {
  const account = await currentAccount()
  if (!account?.email) throw new Error('Sign in to change your records.')
  return account.email
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

export async function createDonationRecord(input: { amount: number; message: string; campaignId?: string; beneficiaryId?: string }) {
  const email = await donorEmail()
  const account = await currentAccount()
  const amount = Math.round(Number(input.amount))
  if (!amount || amount < 500) throw new Error('Enter an amount of at least 500 UGX.')
  const support = input.beneficiaryId ? 'child' : input.campaignId ? 'campaign' : 'general'
  const today = new Date().toISOString().slice(0, 10)
  const donationId = id('d')
  const reference = `NOTE-${Date.now().toString(36).toUpperCase()}`
  const db = getDb()
  db.prepare(`INSERT INTO donations (id, donor_name, anonymous, email, phone, amount, frequency, campaign_id, beneficiary_id, support_target, method, transaction_id, date, status, message)
    VALUES (?, ?, 0, ?, ?, ?, 'one-time', ?, ?, ?, 'Recorded', ?, ?, 'Pending', ?)`).run(
    donationId,
    account?.name || 'Donor',
    email,
    account?.phone || '',
    amount,
    input.campaignId || null,
    input.beneficiaryId || null,
    support,
    reference,
    today,
    input.message.trim(),
  )
  db.prepare('INSERT INTO transactions (id, donation_id, provider, reference, amount, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id('pt'), donationId, 'Recorded', reference, amount, 'Pending', today,
  )
  refresh()
}

export async function updateDonationMessage(donationId: string, message: string) {
  const email = await donorEmail()
  if (!ownedDonation(email, donationId)) throw new Error('That gift is not on your account.')
  getDb().prepare('UPDATE donations SET message = ? WHERE id = ? AND lower(email) = ?').run(message.trim(), donationId, donorKey(email))
  refresh()
}

export async function deleteDonationRecord(donationId: string) {
  const email = await donorEmail()
  if (!ownedDonation(email, donationId)) throw new Error('That gift is not on your account.')
  const db = getDb()
  db.prepare('DELETE FROM transactions WHERE donation_id = ?').run(donationId)
  db.prepare('DELETE FROM donations WHERE id = ? AND lower(email) = ?').run(donationId, donorKey(email))
  refresh()
}

export async function saveCampaignLink(campaignId: string, note: string) {
  const email = await donorEmail()
  getDb().prepare(`INSERT INTO campaign_links (email, campaign_id, note, hidden) VALUES (?, ?, ?, 0)
    ON CONFLICT(email, campaign_id) DO UPDATE SET note = excluded.note, hidden = 0`).run(donorKey(email), campaignId, note.trim())
  refresh()
}

export async function hideCampaignLink(campaignId: string) {
  const email = await donorEmail()
  getDb().prepare(`INSERT INTO campaign_links (email, campaign_id, note, hidden) VALUES (?, ?, '', 1)
    ON CONFLICT(email, campaign_id) DO UPDATE SET hidden = 1`).run(donorKey(email), campaignId)
  refresh()
}

export async function saveSponsorship(beneficiaryId: string, note: string) {
  const email = await donorEmail()
  getDb().prepare(`INSERT INTO sponsorships (email, beneficiary_id, note, hidden) VALUES (?, ?, ?, 0)
    ON CONFLICT(email, beneficiary_id) DO UPDATE SET note = excluded.note, hidden = 0`).run(donorKey(email), beneficiaryId, note.trim())
  refresh()
}

export async function hideSponsorship(beneficiaryId: string) {
  const email = await donorEmail()
  getDb().prepare(`INSERT INTO sponsorships (email, beneficiary_id, note, hidden) VALUES (?, ?, '', 1)
    ON CONFLICT(email, beneficiary_id) DO UPDATE SET hidden = 1`).run(donorKey(email), beneficiaryId)
  refresh()
}

export async function createDonorUpdate(input: { title: string; body: string }) {
  const email = await donorEmail()
  if (!input.title.trim() || !input.body.trim()) throw new Error('Add a title and a note.')
  getDb().prepare('INSERT INTO donor_updates (id, email, title, body, date) VALUES (?, ?, ?, ?, ?)').run(
    id('du'), donorKey(email), input.title.trim(), input.body.trim(), new Date().toISOString().slice(0, 10),
  )
  refresh()
}

export async function updateDonorUpdate(updateId: string, input: { title: string; body: string }) {
  const email = await donorEmail()
  if (!input.title.trim() || !input.body.trim()) throw new Error('Add a title and a note.')
  const result = getDb().prepare('UPDATE donor_updates SET title = ?, body = ? WHERE id = ? AND lower(email) = ?').run(input.title.trim(), input.body.trim(), updateId, donorKey(email))
  if (Number(result.changes) === 0) throw new Error('That note is not on your account.')
  refresh()
}

export async function deleteDonorUpdate(updateId: string) {
  const email = await donorEmail()
  getDb().prepare('DELETE FROM donor_updates WHERE id = ? AND lower(email) = ?').run(updateId, donorKey(email))
  refresh()
}

export async function createNotification(input: { title: string; body: string }) {
  const email = await donorEmail()
  if (!input.title.trim()) throw new Error('Add a title.')
  getDb().prepare('INSERT INTO notifications (id, title, body, date, read, email) VALUES (?, ?, ?, ?, 0, ?)').run(
    id('nt'), input.title.trim(), input.body.trim(), new Date().toISOString().slice(0, 10), donorKey(email),
  )
  refresh()
}

export async function setNotificationRead(notificationId: string, read: boolean) {
  const email = await donorEmail()
  getDb().prepare('UPDATE notifications SET read = ? WHERE id = ? AND lower(email) = ?').run(read ? 1 : 0, notificationId, donorKey(email))
  refresh()
}

export async function deleteNotification(notificationId: string) {
  const email = await donorEmail()
  getDb().prepare('DELETE FROM notifications WHERE id = ? AND lower(email) = ?').run(notificationId, donorKey(email))
  refresh()
}

export async function saveEmailUpdates(enabled: boolean) {
  const email = await donorEmail()
  getDb().prepare(`INSERT INTO donor_settings (email, email_updates) VALUES (?, ?)
    ON CONFLICT(email) DO UPDATE SET email_updates = excluded.email_updates`).run(donorKey(email), enabled ? 1 : 0)
  refresh()
}

export async function clearEmailUpdates() {
  const email = await donorEmail()
  getDb().prepare('DELETE FROM donor_settings WHERE lower(email) = ?').run(donorKey(email))
  refresh()
}

export async function deleteDonorProfile() {
  const email = await donorEmail()
  getDb().prepare('DELETE FROM users WHERE lower(email) = ?').run(donorKey(email))
  refresh()
}
