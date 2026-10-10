import { createVerify, type KeyObject, createPublicKey } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { expireStaleDonations, getDb } from '@/lib/db'
import { formatUGX } from '@/lib/format'
import { alertDonor } from '@/lib/notify'
import type { CheckoutDraft, DonationStatus } from '@/lib/types'

function gateway() {
  const base = process.env.PAYTOTA_BASE_URL?.replace(/\/$/, '')
  const secret = process.env.PAYTOTA_SECRET_KEY
  const brand = process.env.PAYTOTA_BRAND_ID
  if (!base || !secret || !brand) return null
  return { base, secret, brand }
}

function publicKey(): KeyObject | null {
  const raw = process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY?.replace(/\\n/g, '\n').trim()
  if (!raw) return null
  const pem = raw.includes('BEGIN')
    ? raw
    : `-----BEGIN PUBLIC KEY-----\n${raw}\n-----END PUBLIC KEY-----`
  try {
    return createPublicKey(pem)
  } catch {
    return null
  }
}

export function verifyCallback(body: string, signature: string | null) {
  const key = publicKey()
  if (!key || !signature) return false
  const verifier = createVerify('SHA256')
  verifier.update(body)
  verifier.end()
  try {
    return verifier.verify(key, signature, 'base64')
  } catch {
    return false
  }
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('256') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `256${digits.slice(1)}`
  if (digits.length === 9) return `256${digits}`
  return ''
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

async function origin() {
  const host = (await headers()).get('x-forwarded-host') || (await headers()).get('host') || ''
  if (host.includes('localhost') || host.startsWith('127.')) return `http://${host}`
  return (process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || `https://${host}`).replace(/\/$/, '')
}

function productName(draft: CheckoutDraft) {
  if (draft.frequency === 'monthly') return 'Monthly education gift'
  if (draft.supportTarget === 'child') return 'Learner sponsorship'
  if (draft.supportTarget === 'campaign') return 'Campaign gift'
  return 'Education gift'
}

export async function startDonation(draft: CheckoutDraft) {
  const config = gateway()
  if (!config) throw new Error('Payments are not configured yet.')
  const phone = normalizePhone(draft.phone)
  if (!phone) throw new Error('Enter a Uganda mobile number so we can send the payment prompt.')
  if (!draft.amount || draft.amount < 500) throw new Error('Enter an amount of at least 500 UGX.')
  const email = draft.email.trim()
  if (!draft.anonymous && (!draft.name.trim() || !draft.message.trim())) throw new Error('Name and a reason for the gift are required.')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  const donorName = draft.anonymous ? 'Anonymous donor' : draft.name.trim()
  const donorEmail = email || 'gifts@schoolpesa.example'

  const reference = `SP-${Date.now().toString(36).toUpperCase()}`
  const site = await origin()
  const response = await fetch(`${config.base}/api/v1/purchases/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client: {
        email: donorEmail,
        phone,
        country: 'UG',
        full_name: donorName,
      },
      purchase: {
        currency: 'UGX',
        products: [{ name: productName(draft), price: String(draft.amount) }],
      },
      reference,
      brand_id: config.brand,
      skip_capture: false,
      force_recurring: draft.frequency === 'monthly',
      success_redirect: `${site}/payments/success?reference=${reference}`,
      failure_redirect: `${site}/payments/failure?reference=${reference}`,
      cancel_redirect: `${site}/payments/cancel?reference=${reference}`,
    }),
  })
  const created = await response.json().catch(() => null) as { id?: string; reference?: string } | null
  if (!response.ok || !created?.id) throw new Error('The payment could not be started. Try again in a moment.')

  const form = new FormData()
  form.set('s2s', 'true')
  form.set('pm', 'paytota_proxy')
  const executed = await fetch(`${config.base}/p/${created.id}/`, { method: 'POST', body: form })
  if (!executed.ok) throw new Error('The payment prompt could not be sent. Check the mobile number and try again.')

  const today = new Date().toISOString().slice(0, 10)
  const createdAt = new Date().toISOString()
  const donationId = id('d')
  const db = getDb()
  db.prepare(`INSERT INTO donations (id, donor_name, anonymous, email, phone, amount, frequency, campaign_id, beneficiary_id, support_target, method, transaction_id, date, status, message, external_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    donationId,
    draft.anonymous ? 'Anonymous' : donorName,
    draft.anonymous ? 1 : 0,
    donorEmail,
    phone,
    draft.amount,
    draft.frequency,
    draft.campaignId ?? null,
    draft.beneficiaryId ?? null,
    draft.supportTarget,
    'Mobile money',
    reference,
    today,
    'Processing',
    draft.message || null,
    created.id,
    createdAt,
  )
  db.prepare('INSERT INTO transactions (id, donation_id, provider, reference, amount, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id('pt'), donationId, 'Mobile money', reference, draft.amount, 'Processing', today,
  )
  alertDonor(donorEmail, {
    title: 'Payment prompt sent',
    body: `Approve ${formatUGX(draft.amount)} on your phone. Reference ${reference}.`,
    kind: 'gift',
    href: '/dashboard/donations',
  })
  revalidatePath('/dashboard')
  revalidatePath('/admin/donations')
  return { reference, status: 'prompt' as const }
}

function mapStatus(status: string, eventType: string): DonationStatus | null {
  const value = `${eventType} ${status}`.toLowerCase()
  if (value.includes('paid') || value.includes('settled') || value.includes('captured')) return 'Successful'
  if (value.includes('refund')) return 'Refunded'
  if (value.includes('cancel')) return 'Cancelled'
  if (value.includes('fail') || value.includes('error')) return 'Failed'
  if (value.includes('pending') || value.includes('viewed') || value.includes('created') || value.includes('hold')) return 'Processing'
  return null
}

export function applyPaymentUpdate(payload: { id?: string; reference?: string; status?: string; event_type?: string }) {
  const next = mapStatus(payload.status || '', payload.event_type || '')
  if (!next) return { updated: false }
  const db = getDb()
  const row = db.prepare('SELECT id, amount, campaign_id, beneficiary_id, status, transaction_id, email FROM donations WHERE transaction_id = ? OR external_id = ?').get(payload.reference ?? '', payload.id ?? '') as {
    id: string
    amount: number
    campaign_id: string | null
    beneficiary_id: string | null
    status: string
    transaction_id: string
    email: string | null
  } | undefined
  if (!row || row.status === next) return { updated: false, reference: row?.transaction_id }
  const wasSuccessful = row.status === 'Successful'
  db.prepare('UPDATE donations SET status = ? WHERE id = ?').run(next, row.id)
  db.prepare('UPDATE transactions SET status = ? WHERE donation_id = ?').run(next, row.id)
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
  if (row.email) {
    const confirmed = next === 'Successful'
    alertDonor(row.email, {
      title: confirmed ? 'Gift confirmed' : `Gift ${next.toLowerCase()}`,
      body: confirmed ? `${formatUGX(row.amount)} is confirmed. Reference ${row.transaction_id}.` : `${formatUGX(row.amount)} is now ${next.toLowerCase()}. Reference ${row.transaction_id}.`,
      kind: 'gift',
      href: confirmed ? '/dashboard/receipts' : '/dashboard/donations',
    })
  }
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  revalidatePath('/admin/donations')
  revalidatePath('/impact')
  revalidatePath('/campaigns')
  return { updated: true, reference: row.transaction_id, status: next }
}

export function paymentStatus(reference: string) {
  expireStaleDonations()
  const row = getDb().prepare('SELECT status, amount, frequency FROM donations WHERE transaction_id = ?').get(reference) as { status: string; amount: number; frequency: string } | undefined
  if (!row) return null
  return { reference, status: row.status, amount: row.amount, frequency: row.frequency }
}
