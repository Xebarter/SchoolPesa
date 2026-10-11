import { createVerify, type KeyObject, createPublicKey } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { expireStaleDonations, getDb } from '@/lib/db'
import { formatUGX } from '@/lib/format'
import { alertDonor } from '@/lib/notify'
import type { CheckoutDraft, DonationStatus } from '@/lib/types'

async function result<T>(operation: PromiseLike<{ data: T; error: { message: string } | null }>, context: string): Promise<T> {
  const { data, error } = await operation
  if (error) throw new Error(`Could not ${context}: ${error.message}`)
  return data
}

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
  await result(db.from('donations').insert({
    id: donationId, donor_name: draft.anonymous ? 'Anonymous' : donorName, anonymous: draft.anonymous,
    email: donorEmail, phone, amount: draft.amount, frequency: draft.frequency,
    campaign_id: draft.campaignId ?? null, beneficiary_id: draft.beneficiaryId ?? null,
    support_target: draft.supportTarget, method: 'Mobile money', transaction_id: reference,
    date: today, status: 'Processing', message: draft.message || null, external_id: created.id, created_at: createdAt,
  }), 'record checkout donation')
  await result(db.from('transactions').insert({
    id: id('pt'), donation_id: donationId, provider: 'Mobile money', reference,
    amount: draft.amount, status: 'Processing', date: today,
  }), 'record checkout transaction')
  await alertDonor(donorEmail, {
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

export async function applyPaymentUpdate(payload: { id?: string; reference?: string; status?: string; event_type?: string }) {
  const next = mapStatus(payload.status || '', payload.event_type || '')
  if (!next) return { updated: false }
  const db = getDb()
  const row = await result((payload.reference
    ? db.from('donations').select('id, amount, status, transaction_id, external_id, email').eq('transaction_id', payload.reference).maybeSingle()
    : db.from('donations').select('id, amount, status, transaction_id, external_id, email').eq('external_id', payload.id ?? '').maybeSingle()), 'find callback donation') as {
    id: string
    amount: number
    status: string
    transaction_id: string
    external_id: string | null
    email: string | null
  } | null
  const matchedById = !row && payload.id
    ? await result(db.from('donations').select('id, amount, status, transaction_id, external_id, email').eq('external_id', payload.id).maybeSingle(), 'find callback donation by provider id') as typeof row
    : null
  const donation = row ?? matchedById
  if (!donation || donation.status === next) return { updated: false, reference: donation?.transaction_id }
  const rpcReference = donation.transaction_id || donation.external_id || payload.reference || payload.id || ''
  const status = await result(db.rpc('apply_payment_status', { p_reference: rpcReference, p_status: next }), 'apply payment status')
  if (status === 'missing') return { updated: false }
  if (donation.email) {
    const confirmed = next === 'Successful'
    await alertDonor(donation.email, {
      title: confirmed ? 'Gift confirmed' : `Gift ${next.toLowerCase()}`,
      body: confirmed ? `${formatUGX(donation.amount)} is confirmed. Reference ${donation.transaction_id}.` : `${formatUGX(donation.amount)} is now ${next.toLowerCase()}. Reference ${donation.transaction_id}.`,
      kind: 'gift',
      href: confirmed ? '/dashboard/receipts' : '/dashboard/donations',
    })
  }
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  revalidatePath('/admin/donations')
  revalidatePath('/impact')
  revalidatePath('/campaigns')
  return { updated: true, reference: donation.transaction_id, status: next }
}

export async function paymentStatus(reference: string) {
  await expireStaleDonations()
  const row = await result(getDb().from('donations').select('status, amount, frequency').eq('transaction_id', reference).maybeSingle(), 'read payment status') as { status: string; amount: number; frequency: string } | null
  if (!row) return null
  return { reference, status: row.status, amount: row.amount, frequency: row.frequency }
}
