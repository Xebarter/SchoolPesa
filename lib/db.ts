import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  AuditLog,
  Beneficiary,
  Campaign,
  Donation,
  EventItem,
  Expense,
  Faq,
  GalleryItem,
  NewsArticle,
  NotificationItem,
  Partner,
  PaymentTransaction,
  Story,
  User,
  Volunteer,
} from '@/lib/types'

type Row = Record<string, unknown>

export function getDb() {
  return createAdminClient()
}

async function rows<T extends Row>(db: SupabaseClient, table: string, order?: { column: string; ascending?: boolean }): Promise<T[]> {
  let query = db.from(table).select('*')
  if (order) query = query.order(order.column, { ascending: order.ascending ?? true })
  const { data, error } = await query
  if (error) throw new Error(`Could not read ${table}: ${error.message}`)
  return (data ?? []) as T[]
}

function text(row: Row, key: string, fallback = '') {
  const value = row[key]
  return value == null ? fallback : String(value)
}

function optionalText(row: Row, key: string) {
  const value = row[key]
  return value == null || value === '' ? undefined : String(value)
}

function number(row: Row, key: string) {
  const value = Number(row[key])
  return Number.isFinite(value) ? value : 0
}

function jsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function mapCampaign(row: Row): Campaign {
  return {
    id: text(row, 'id'),
    slug: text(row, 'slug'),
    title: text(row, 'title'),
    summary: text(row, 'summary'),
    description: text(row, 'description'),
    story: text(row, 'story'),
    category: text(row, 'category'),
    level: text(row, 'level') as Campaign['level'],
    location: text(row, 'location'),
    status: text(row, 'status') as Campaign['status'],
    target: number(row, 'target'),
    raised: number(row, 'raised'),
    donors: number(row, 'donors'),
    deadline: text(row, 'deadline'),
    createdAt: text(row, 'created_at'),
    image: text(row, 'image'),
    gallery: jsonArray<string>(row.gallery),
    video: optionalText(row, 'video'),
    beneficiaryId: optionalText(row, 'beneficiary_id'),
    seoTitle: text(row, 'seo_title'),
    seoDescription: text(row, 'seo_description'),
    updates: jsonArray(row.updates),
    ownerEmail: optionalText(row, 'owner_email'),
  }
}

function mapBeneficiary(row: Row): Beneficiary {
  return {
    id: text(row, 'id'),
    displayName: text(row, 'display_name'),
    level: text(row, 'level') as Beneficiary['level'],
    school: text(row, 'school'),
    location: text(row, 'location'),
    story: text(row, 'story'),
    needs: text(row, 'needs'),
    target: number(row, 'target'),
    raised: number(row, 'raised'),
    image: text(row, 'image'),
    publicProfile: Boolean(row.public_profile),
    publicImage: Boolean(row.public_image),
    storyVisible: Boolean(row.story_visible),
    status: text(row, 'status') as Beneficiary['status'],
    updates: jsonArray(row.updates),
    ownerEmail: optionalText(row, 'owner_email'),
  }
}

export async function listCampaigns(): Promise<Campaign[]> {
  return (await rows(getDb(), 'campaigns', { column: 'created_at', ascending: false })).map(mapCampaign)
}

export async function listBeneficiaries(): Promise<Beneficiary[]> {
  return (await rows(getDb(), 'beneficiaries')).map(mapBeneficiary)
}

export async function expireStaleDonations() {
  const db = getDb()
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: stale, error: readError } = await db.from('donations')
    .select('id')
    .in('status', ['Pending', 'Processing'])
    .lte('created_at', cutoff)
  if (readError) throw new Error(`Could not find expired donations: ${readError.message}`)
  const ids = (stale ?? []).map((item) => item.id)
  if (!ids.length) return
  const { error: donationError } = await db.from('donations').update({ status: 'Failed' }).in('id', ids)
  if (donationError) throw new Error(`Could not expire stale donations: ${donationError.message}`)
  const { error: transactionError } = await db.from('transactions').update({ status: 'Failed' }).in('donation_id', ids).in('status', ['Pending', 'Processing'])
  if (transactionError) throw new Error(`Could not expire stale transactions: ${transactionError.message}`)
}

export async function listDonations(): Promise<Donation[]> {
  await expireStaleDonations()
  const data = await rows(getDb(), 'donations', { column: 'created_at', ascending: false })
  return data.map((row) => ({
    id: text(row, 'id'),
    donorName: text(row, 'donor_name'),
    anonymous: Boolean(row.anonymous),
    email: text(row, 'email'),
    phone: text(row, 'phone'),
    amount: number(row, 'amount'),
    frequency: text(row, 'frequency') as Donation['frequency'],
    campaignId: optionalText(row, 'campaign_id'),
    beneficiaryId: optionalText(row, 'beneficiary_id'),
    supportTarget: text(row, 'support_target') as Donation['supportTarget'],
    method: text(row, 'method'),
    transactionId: text(row, 'transaction_id'),
    date: text(row, 'date'),
    status: text(row, 'status') as Donation['status'],
    message: optionalText(row, 'message'),
  }))
}

export async function listTransactions(): Promise<PaymentTransaction[]> {
  return (await rows(getDb(), 'transactions', { column: 'date', ascending: false })).map((row) => ({
    id: text(row, 'id'),
    donationId: text(row, 'donation_id'),
    provider: text(row, 'provider'),
    reference: text(row, 'reference'),
    amount: number(row, 'amount'),
    status: text(row, 'status') as PaymentTransaction['status'],
    date: text(row, 'date'),
  }))
}

export async function listStories(): Promise<Story[]> {
  return (await rows(getDb(), 'stories', { column: 'date', ascending: false })).map((row) => ({
    id: text(row, 'id'),
    slug: text(row, 'slug'),
    title: text(row, 'title'),
    excerpt: text(row, 'excerpt'),
    body: text(row, 'body'),
    category: text(row, 'category'),
    author: text(row, 'author'),
    date: text(row, 'date'),
    image: text(row, 'image'),
    gallery: jsonArray<string>(row.gallery),
    campaignId: optionalText(row, 'campaign_id'),
    beneficiaryId: optionalText(row, 'beneficiary_id'),
    status: text(row, 'status') as Story['status'],
    views: number(row, 'views'),
  }))
}

export async function listGallery(): Promise<GalleryItem[]> {
  return (await rows(getDb(), 'gallery')).map((row) => ({
    id: text(row, 'id'),
    src: text(row, 'src'),
    alt: text(row, 'alt'),
    caption: text(row, 'caption'),
    category: text(row, 'category'),
    campaignId: optionalText(row, 'campaign_id'),
    storyId: optionalText(row, 'story_id'),
  }))
}

export async function listNews(): Promise<NewsArticle[]> {
  return (await rows(getDb(), 'news', { column: 'date', ascending: false })).map((row) => ({
    id: text(row, 'id'),
    slug: text(row, 'slug'),
    title: text(row, 'title'),
    excerpt: text(row, 'excerpt'),
    body: text(row, 'body'),
    category: text(row, 'category'),
    date: text(row, 'date'),
    image: text(row, 'image'),
  }))
}

export async function listEvents(): Promise<EventItem[]> {
  return (await rows(getDb(), 'events', { column: 'date' })).map((row) => ({
    id: text(row, 'id'),
    name: text(row, 'name'),
    date: text(row, 'date'),
    time: text(row, 'time'),
    location: text(row, 'location'),
    description: text(row, 'description'),
    image: text(row, 'image'),
  }))
}

export async function listPartners(): Promise<Partner[]> {
  return (await rows(getDb(), 'partners')).map((row) => ({
    id: text(row, 'id'),
    name: text(row, 'name'),
    logoUrl: optionalText(row, 'logo_url'),
  }))
}

export async function listUsers(): Promise<User[]> {
  return (await rows(getDb(), 'users')).map((row) => ({
    id: text(row, 'id'),
    name: text(row, 'name'),
    email: text(row, 'email'),
    role: text(row, 'role') as User['role'],
    phone: optionalText(row, 'phone'),
  }))
}

export async function listVolunteers(): Promise<Volunteer[]> {
  return (await rows(getDb(), 'volunteers')).map((row) => ({
    id: text(row, 'id'),
    name: text(row, 'name'),
    email: text(row, 'email'),
    phone: text(row, 'phone'),
    skills: text(row, 'skills'),
    interest: text(row, 'interest'),
    availability: text(row, 'availability'),
    message: text(row, 'message'),
    status: text(row, 'status') as Volunteer['status'],
  }))
}

export async function listExpenses(): Promise<Expense[]> {
  return (await rows(getDb(), 'expenses', { column: 'date', ascending: false })).map((row) => ({
    id: text(row, 'id'),
    date: text(row, 'date'),
    category: text(row, 'category'),
    campaignId: optionalText(row, 'campaign_id'),
    description: text(row, 'description'),
    amount: number(row, 'amount'),
    supplier: text(row, 'supplier'),
    receipt: text(row, 'receipt'),
    status: text(row, 'status') as Expense['status'],
  }))
}

export async function listNotifications(): Promise<NotificationItem[]> {
  return (await rows(getDb(), 'notifications', { column: 'date', ascending: false })).map((row) => ({
    id: text(row, 'id'),
    title: text(row, 'title'),
    body: text(row, 'body'),
    date: text(row, 'date'),
    read: Boolean(row.read),
    kind: optionalText(row, 'kind'),
    href: optionalText(row, 'href'),
    createdAt: optionalText(row, 'created_at'),
  }))
}

export async function listFaqs(): Promise<Faq[]> {
  const data = await rows(getDb(), 'faqs')
  return data.map((row) => ({ id: text(row, 'id'), question: text(row, 'question'), answer: text(row, 'answer'), topic: text(row, 'topic') }))
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  const data = await rows(getDb(), 'audit_logs', { column: 'date', ascending: false })
  return data.map((row) => ({
    id: text(row, 'id'),
    user: text(row, 'user'),
    action: text(row, 'action'),
    resource: text(row, 'resource'),
    date: text(row, 'date'),
    time: text(row, 'time'),
    details: text(row, 'details'),
  }))
}

export async function listDonationSeries() {
  return (await rows(getDb(), 'donation_series')).map((row) => ({ month: text(row, 'month'), amount: number(row, 'amount') }))
}

export async function listLevelSplit() {
  return (await rows(getDb(), 'level_split')).map((row) => ({ name: text(row, 'name'), value: number(row, 'value') }))
}

export async function getImpactStats() {
  const { data, error } = await getDb().from('impact_stats').select('*').eq('id', 1).single()
  if (error) throw new Error(`Could not read impact stats: ${error.message}`)
  const row = data as Row
  return {
    childrenSupported: number(row, 'children_supported'),
    fundsRaised: number(row, 'funds_raised'),
    schoolsReached: number(row, 'schools_reached'),
    campaignsCompleted: number(row, 'campaigns_completed'),
    scholarships: number(row, 'scholarships'),
    books: number(row, 'books'),
    uniforms: number(row, 'uniforms'),
    thisMonth: number(row, 'this_month'),
    activeCampaigns: number(row, 'active_campaigns'),
  }
}

export async function listSettings() {
  const data = await rows(getDb(), 'settings')
  return Object.fromEntries(data.map((row) => [text(row, 'key'), text(row, 'value')]))
}

export async function syncCampaignImpact() {
  const db = getDb()
  const [{ count: active, error: activeError }, { count: completed, error: completedError }] = await Promise.all([
    db.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ])
  if (activeError) throw new Error(`Could not count active campaigns: ${activeError.message}`)
  if (completedError) throw new Error(`Could not count completed campaigns: ${completedError.message}`)
  const { error } = await db.from('impact_stats').update({
    active_campaigns: active ?? 0,
    campaigns_completed: completed ?? 0,
  }).eq('id', 1)
  if (error) throw new Error(`Could not update impact stats: ${error.message}`)
}
