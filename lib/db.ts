import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { campaigns as seedCampaigns } from '@/lib/data/campaigns'
import { events as seedEvents, faqs as seedFaqs, gallery as seedGallery, news as seedNews, stories as seedStories } from '@/lib/data/content'
import { auditLogs as seedAudit, donationSeries as seedSeries, donations as seedDonations, expenses as seedExpenses, impactStats as seedImpact, levelSplit as seedLevels, notifications as seedNotes, transactions as seedTransactions } from '@/lib/data/giving'
import { beneficiaries as seedBeneficiaries, partners as seedPartners, users as seedUsers, volunteers as seedVolunteers } from '@/lib/data/people'
import type { AuditLog, Beneficiary, Campaign, Donation, EventItem, Expense, Faq, GalleryItem, NewsArticle, NotificationItem, Partner, PaymentTransaction, Story, User, Volunteer } from '@/lib/types'

const file = join(process.cwd(), 'data', 'schoolpesa.db')
mkdirSync(join(process.cwd(), 'data'), { recursive: true })

const database = new DatabaseSync(file)
database.exec('PRAGMA journal_mode = WAL')
database.exec('PRAGMA foreign_keys = ON')

database.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL, phone TEXT
);
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, summary TEXT, description TEXT, story TEXT,
  category TEXT, level TEXT, location TEXT, status TEXT, target INTEGER, raised INTEGER, donors INTEGER,
  deadline TEXT, created_at TEXT, image TEXT, gallery TEXT, video TEXT, beneficiary_id TEXT, seo_title TEXT, seo_description TEXT, updates TEXT
);
CREATE TABLE IF NOT EXISTS beneficiaries (
  id TEXT PRIMARY KEY, display_name TEXT, level TEXT, school TEXT, location TEXT, story TEXT, needs TEXT,
  target INTEGER, raised INTEGER, image TEXT, public_profile INTEGER, public_image INTEGER, story_visible INTEGER, status TEXT, updates TEXT
);
CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY, donor_name TEXT, anonymous INTEGER, email TEXT, phone TEXT, amount INTEGER, frequency TEXT,
  campaign_id TEXT, beneficiary_id TEXT, support_target TEXT, method TEXT, transaction_id TEXT, date TEXT, status TEXT, message TEXT
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, donation_id TEXT, provider TEXT, reference TEXT, amount INTEGER, status TEXT, date TEXT
);
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT, excerpt TEXT, body TEXT, category TEXT, author TEXT,
  date TEXT, image TEXT, gallery TEXT, campaign_id TEXT, beneficiary_id TEXT, status TEXT, views INTEGER
);
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY, src TEXT, alt TEXT, caption TEXT, category TEXT, campaign_id TEXT, story_id TEXT
);
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT, excerpt TEXT, body TEXT, category TEXT, date TEXT, image TEXT
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, name TEXT, date TEXT, time TEXT, location TEXT, description TEXT, image TEXT
);
CREATE TABLE IF NOT EXISTS partners (id TEXT PRIMARY KEY, name TEXT, logo_url TEXT);
CREATE TABLE IF NOT EXISTS volunteers (
  id TEXT PRIMARY KEY, name TEXT, email TEXT, phone TEXT, skills TEXT, interest TEXT, availability TEXT, message TEXT, status TEXT
);
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY, date TEXT, category TEXT, campaign_id TEXT, description TEXT, amount INTEGER, supplier TEXT, receipt TEXT, status TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, title TEXT, body TEXT, date TEXT, read INTEGER
);
CREATE TABLE IF NOT EXISTS faqs (id TEXT PRIMARY KEY, question TEXT, answer TEXT, topic TEXT);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, user TEXT, action TEXT, resource TEXT, date TEXT, time TEXT, details TEXT
);
CREATE TABLE IF NOT EXISTS donation_series (month TEXT PRIMARY KEY, amount REAL);
CREATE TABLE IF NOT EXISTS level_split (name TEXT PRIMARY KEY, value INTEGER);
CREATE TABLE IF NOT EXISTS impact_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  children_supported INTEGER, funds_raised INTEGER, schools_reached INTEGER, campaigns_completed INTEGER,
  scholarships INTEGER, books INTEGER, uniforms INTEGER, this_month INTEGER, active_campaigns INTEGER
);
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY, name TEXT, email TEXT, message TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS newsletter (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TEXT);
CREATE TABLE IF NOT EXISTS event_registrations (id TEXT PRIMARY KEY, event_name TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
`)

try { database.exec('ALTER TABLE donations ADD COLUMN external_id TEXT') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donations ADD COLUMN created_at TEXT') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE campaigns ADD COLUMN owner_email TEXT') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE beneficiaries ADD COLUMN owner_email TEXT') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE notifications ADD COLUMN email TEXT') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE notifications ADD COLUMN kind TEXT') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE notifications ADD COLUMN href TEXT') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE notifications ADD COLUMN created_at TEXT') } catch { /* column already exists */ }
database.exec(`
CREATE TABLE IF NOT EXISTS donor_settings (
  email TEXT PRIMARY KEY,
  email_updates INTEGER NOT NULL DEFAULT 1,
  receipt_emails INTEGER NOT NULL DEFAULT 1,
  digest INTEGER NOT NULL DEFAULT 1,
  product_news INTEGER NOT NULL DEFAULT 0,
  anonymous_default INTEGER NOT NULL DEFAULT 1,
  public_recognition INTEGER NOT NULL DEFAULT 0,
  update_cadence TEXT NOT NULL DEFAULT 'instant'
);
CREATE TABLE IF NOT EXISTS campaign_links (
  email TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  hidden INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email, campaign_id)
);
CREATE TABLE IF NOT EXISTS sponsorships (
  email TEXT NOT NULL,
  beneficiary_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  hidden INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email, beneficiary_id)
);
CREATE TABLE IF NOT EXISTS donor_updates (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  campaign_id TEXT,
  beneficiary_id TEXT,
  review_note TEXT NOT NULL DEFAULT '',
  story_id TEXT,
  category TEXT NOT NULL DEFAULT 'Success Stories'
);
`)
try { database.exec("ALTER TABLE donor_updates ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'") } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donor_updates ADD COLUMN campaign_id TEXT') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donor_updates ADD COLUMN beneficiary_id TEXT') } catch { /* column already exists */ }
try { database.exec("ALTER TABLE donor_updates ADD COLUMN review_note TEXT NOT NULL DEFAULT ''") } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donor_updates ADD COLUMN story_id TEXT') } catch { /* column already exists */ }
try { database.exec("ALTER TABLE donor_updates ADD COLUMN category TEXT NOT NULL DEFAULT 'Success Stories'") } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donor_settings ADD COLUMN receipt_emails INTEGER NOT NULL DEFAULT 1') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donor_settings ADD COLUMN digest INTEGER NOT NULL DEFAULT 1') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donor_settings ADD COLUMN product_news INTEGER NOT NULL DEFAULT 0') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donor_settings ADD COLUMN anonymous_default INTEGER NOT NULL DEFAULT 1') } catch { /* column already exists */ }
try { database.exec('ALTER TABLE donor_settings ADD COLUMN public_recognition INTEGER NOT NULL DEFAULT 0') } catch { /* column already exists */ }
try { database.exec("ALTER TABLE donor_settings ADD COLUMN update_cadence TEXT NOT NULL DEFAULT 'instant'") } catch { /* column already exists */ }

function seed() {
  const count = database.prepare('SELECT COUNT(*) AS n FROM campaigns').get() as { n: number }
  if (count.n > 0) return
  database.exec('BEGIN')
  const user = database.prepare('INSERT INTO users (id, name, email, role, phone) VALUES (?, ?, ?, ?, ?)')
  for (const item of seedUsers) user.run(item.id, item.name, item.email, item.role, item.phone ?? null)
  const campaign = database.prepare(`INSERT INTO campaigns (id, slug, title, summary, description, story, category, level, location, status, target, raised, donors, deadline, created_at, image, gallery, video, beneficiary_id, seo_title, seo_description, updates)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (const item of seedCampaigns) {
    campaign.run(item.id, item.slug, item.title, item.summary, item.description, item.story, item.category, item.level, item.location, item.status, item.target, item.raised, item.donors, item.deadline, item.createdAt, item.image, JSON.stringify(item.gallery), item.video ?? null, item.beneficiaryId ?? null, item.seoTitle, item.seoDescription, JSON.stringify(item.updates))
  }
  const beneficiary = database.prepare(`INSERT INTO beneficiaries (id, display_name, level, school, location, story, needs, target, raised, image, public_profile, public_image, story_visible, status, updates)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (const item of seedBeneficiaries) {
    beneficiary.run(item.id, item.displayName, item.level, item.school, item.location, item.story, item.needs, item.target, item.raised, item.image, item.publicProfile ? 1 : 0, item.publicImage ? 1 : 0, item.storyVisible ? 1 : 0, item.status, JSON.stringify(item.updates))
  }
  const donation = database.prepare(`INSERT INTO donations (id, donor_name, anonymous, email, phone, amount, frequency, campaign_id, beneficiary_id, support_target, method, transaction_id, date, status, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (const item of seedDonations) {
    donation.run(item.id, item.donorName, item.anonymous ? 1 : 0, item.email, item.phone, item.amount, item.frequency, item.campaignId ?? null, item.beneficiaryId ?? null, item.supportTarget, item.method, item.transactionId, item.date, item.status, item.message ?? null)
  }
  const transaction = database.prepare('INSERT INTO transactions (id, donation_id, provider, reference, amount, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const item of seedTransactions) transaction.run(item.id, item.donationId, item.provider, item.reference, item.amount, item.status, item.date)
  const story = database.prepare(`INSERT INTO stories (id, slug, title, excerpt, body, category, author, date, image, gallery, campaign_id, beneficiary_id, status, views)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (const item of seedStories) {
    story.run(item.id, item.slug, item.title, item.excerpt, item.body, item.category, item.author, item.date, item.image, JSON.stringify(item.gallery), item.campaignId ?? null, item.beneficiaryId ?? null, item.status, item.views)
  }
  const photo = database.prepare('INSERT INTO gallery (id, src, alt, caption, category, campaign_id, story_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const item of seedGallery) photo.run(item.id, item.src, item.alt, item.caption, item.category, item.campaignId ?? null, item.storyId ?? null)
  const article = database.prepare('INSERT INTO news (id, slug, title, excerpt, body, category, date, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  for (const item of seedNews) article.run(item.id, item.slug, item.title, item.excerpt, item.body, item.category, item.date, item.image)
  const event = database.prepare('INSERT INTO events (id, name, date, time, location, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const item of seedEvents) event.run(item.id, item.name, item.date, item.time, item.location, item.description, item.image)
  const partner = database.prepare('INSERT INTO partners (id, name, logo_url) VALUES (?, ?, ?)')
  for (const item of seedPartners) partner.run(item.id, item.name, item.logoUrl ?? null)
  const volunteer = database.prepare('INSERT INTO volunteers (id, name, email, phone, skills, interest, availability, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  for (const item of seedVolunteers) volunteer.run(item.id, item.name, item.email, item.phone, item.skills, item.interest, item.availability, item.message, item.status)
  const expense = database.prepare('INSERT INTO expenses (id, date, category, campaign_id, description, amount, supplier, receipt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  for (const item of seedExpenses) expense.run(item.id, item.date, item.category, item.campaignId ?? null, item.description, item.amount, item.supplier, item.receipt, item.status)
  const note = database.prepare('INSERT INTO notifications (id, title, body, date, read) VALUES (?, ?, ?, ?, ?)')
  for (const item of seedNotes) note.run(item.id, item.title, item.body, item.date, item.read ? 1 : 0)
  const faq = database.prepare('INSERT INTO faqs (id, question, answer, topic) VALUES (?, ?, ?, ?)')
  for (const item of seedFaqs) faq.run(item.id, item.question, item.answer, item.topic)
  const audit = database.prepare('INSERT INTO audit_logs (id, user, action, resource, date, time, details) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const item of seedAudit) audit.run(item.id, item.user, item.action, item.resource, item.date, item.time, item.details)
  const month = database.prepare('INSERT INTO donation_series (month, amount) VALUES (?, ?)')
  for (const item of seedSeries) month.run(item.month, item.amount)
  const level = database.prepare('INSERT INTO level_split (name, value) VALUES (?, ?)')
  for (const item of seedLevels) level.run(item.name, item.value)
  database.prepare(`INSERT INTO impact_stats (id, children_supported, funds_raised, schools_reached, campaigns_completed, scholarships, books, uniforms, this_month, active_campaigns)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(seedImpact.childrenSupported, seedImpact.fundsRaised, seedImpact.schoolsReached, seedImpact.campaignsCompleted, seedImpact.scholarships, seedImpact.books, seedImpact.uniforms, seedImpact.thisMonth, seedImpact.activeCampaigns)
  const setting = database.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
  for (const [key, value] of [
    ['name', 'School Pesa'],
    ['logo', '/web-app-manifest-192x192.png'],
    ['description', 'Supporting education. Changing futures.'],
    ['contact', 'hello@schoolpesa.example'],
    ['address', 'Kampala, Uganda'],
    ['currency', 'UGX'],
    ['receiptPrefix', 'SP'],
  ]) setting.run(key, value)
  database.exec('COMMIT')
}

seed()

const faqAnswers: [string, string][] = [
  ['f1', 'You choose an amount, who you want to support, and your contact details. School Pesa sends a mobile money prompt to your phone. The gift is confirmed when you approve it.'],
  ['f5', 'Gifts are collected by a mobile money prompt sent to the number you enter. Approve the prompt on your phone to complete the gift.'],
  ['f6', 'Confirmed gifts appear in your donor dashboard. Open the receipt from that list after the payment is confirmed.'],
  ['f7', 'Yes. Choose a monthly gift and approve the prompt on your phone. Each collection uses the same mobile number.'],
]
const updateFaq = database.prepare('UPDATE faqs SET answer = ? WHERE id = ?')
for (const [faqId, answer] of faqAnswers) updateFaq.run(answer, faqId)

function json<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  return JSON.parse(value) as T
}

export function getDb() {
  return database
}

export function syncCampaignImpact() {
  const active = database.prepare("SELECT COUNT(*) AS n FROM campaigns WHERE status = 'active'").get() as { n: number }
  const completed = database.prepare("SELECT COUNT(*) AS n FROM campaigns WHERE status = 'completed'").get() as { n: number }
  database.prepare('UPDATE impact_stats SET active_campaigns = ?, campaigns_completed = ? WHERE id = 1').run(Number(active.n), Number(completed.n))
}

export function listCampaigns(): Campaign[] {
  const rows = database.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all() as Record<string, string | number | null>[]
  return rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary ?? ''),
    description: String(row.description ?? ''),
    story: String(row.story ?? ''),
    category: String(row.category ?? ''),
    level: row.level as Campaign['level'],
    location: String(row.location ?? ''),
    status: row.status as Campaign['status'],
    target: Number(row.target),
    raised: Number(row.raised),
    donors: Number(row.donors),
    deadline: String(row.deadline),
    createdAt: String(row.created_at),
    image: String(row.image ?? ''),
    gallery: json<string[]>(String(row.gallery ?? '[]'), []),
    video: row.video ? String(row.video) : undefined,
    beneficiaryId: row.beneficiary_id ? String(row.beneficiary_id) : undefined,
    seoTitle: String(row.seo_title ?? ''),
    seoDescription: String(row.seo_description ?? ''),
    updates: json(String(row.updates ?? '[]'), []),
    ownerEmail: row.owner_email ? String(row.owner_email) : undefined,
  }))
}

export function listBeneficiaries(): Beneficiary[] {
  const rows = database.prepare('SELECT * FROM beneficiaries').all() as Record<string, string | number | null>[]
  return rows.map((row) => ({
    id: String(row.id),
    displayName: String(row.display_name),
    level: row.level as Beneficiary['level'],
    school: String(row.school ?? ''),
    location: String(row.location ?? ''),
    story: String(row.story ?? ''),
    needs: String(row.needs ?? ''),
    target: Number(row.target),
    raised: Number(row.raised),
    image: String(row.image ?? ''),
    publicProfile: Boolean(row.public_profile),
    publicImage: Boolean(row.public_image),
    storyVisible: Boolean(row.story_visible),
    status: row.status as Beneficiary['status'],
    updates: json(String(row.updates ?? '[]'), []),
    ownerEmail: row.owner_email ? String(row.owner_email) : undefined,
  }))
}

export function expireStaleDonations() {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  database.prepare(`UPDATE donations SET status = 'Failed' WHERE status IN ('Pending', 'Processing') AND created_at IS NOT NULL AND created_at != '' AND created_at <= ?`).run(cutoff)
  database.prepare(`UPDATE donations SET status = 'Failed' WHERE status IN ('Pending', 'Processing') AND (created_at IS NULL OR created_at = '')`).run()
  database.prepare(`UPDATE transactions SET status = 'Failed' WHERE status IN ('Pending', 'Processing') AND donation_id IN (SELECT id FROM donations WHERE status = 'Failed')`).run()
}

export function listDonations(): Donation[] {
  expireStaleDonations()
  const rows = database.prepare('SELECT * FROM donations ORDER BY COALESCE(created_at, date) DESC').all() as Record<string, string | number | null>[]
  return rows.map((row) => ({
    id: String(row.id),
    donorName: String(row.donor_name),
    anonymous: Boolean(row.anonymous),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    amount: Number(row.amount),
    frequency: row.frequency as Donation['frequency'],
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    beneficiaryId: row.beneficiary_id ? String(row.beneficiary_id) : undefined,
    supportTarget: row.support_target as Donation['supportTarget'],
    method: String(row.method ?? ''),
    transactionId: String(row.transaction_id),
    date: String(row.date),
    status: row.status as Donation['status'],
    message: row.message ? String(row.message) : undefined,
  }))
}

export function listTransactions(): PaymentTransaction[] {
  const rows = database.prepare('SELECT * FROM transactions ORDER BY date DESC').all() as Record<string, string | number>[]
  return rows.map((row) => ({
    id: String(row.id),
    donationId: String(row.donation_id),
    provider: String(row.provider),
    reference: String(row.reference),
    amount: Number(row.amount),
    status: row.status as PaymentTransaction['status'],
    date: String(row.date),
  }))
}

export function listStories(): Story[] {
  const rows = database.prepare('SELECT * FROM stories ORDER BY date DESC').all() as Record<string, string | number | null>[]
  return rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ''),
    body: String(row.body ?? ''),
    category: String(row.category ?? ''),
    author: String(row.author ?? ''),
    date: String(row.date),
    image: String(row.image ?? ''),
    gallery: json<string[]>(String(row.gallery ?? '[]'), []),
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    beneficiaryId: row.beneficiary_id ? String(row.beneficiary_id) : undefined,
    status: row.status as Story['status'],
    views: Number(row.views),
  }))
}

export function listGallery(): GalleryItem[] {
  const rows = database.prepare('SELECT * FROM gallery').all() as Record<string, string | null>[]
  return rows.map((row) => ({
    id: String(row.id),
    src: String(row.src),
    alt: String(row.alt ?? ''),
    caption: String(row.caption ?? ''),
    category: String(row.category ?? ''),
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    storyId: row.story_id ? String(row.story_id) : undefined,
  }))
}

export function listNews(): NewsArticle[] {
  const rows = database.prepare('SELECT * FROM news ORDER BY date DESC').all() as Record<string, string>[]
  return rows.map((row) => ({
    id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, body: row.body, category: row.category, date: row.date, image: row.image,
  }))
}

export function listEvents(): EventItem[] {
  const rows = database.prepare('SELECT * FROM events ORDER BY date').all() as Record<string, string>[]
  return rows.map((row) => ({ id: row.id, name: row.name, date: row.date, time: row.time, location: row.location, description: row.description, image: row.image }))
}

export function listPartners(): Partner[] {
  const rows = database.prepare('SELECT * FROM partners').all() as Record<string, string | null>[]
  return rows.map((row) => ({ id: String(row.id), name: String(row.name), logoUrl: row.logo_url ? String(row.logo_url) : undefined }))
}

export function listUsers(): User[] {
  const rows = database.prepare('SELECT * FROM users').all() as Record<string, string | null>[]
  return rows.map((row) => ({ id: String(row.id), name: String(row.name), email: String(row.email), role: row.role as User['role'], phone: row.phone ? String(row.phone) : undefined }))
}

export function listVolunteers(): Volunteer[] {
  const rows = database.prepare('SELECT id, name, email, phone, skills, interest, availability, message, status FROM volunteers').all() as Record<string, string>[]
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    skills: row.skills,
    interest: row.interest,
    availability: row.availability,
    message: row.message,
    status: row.status as Volunteer['status'],
  }))
}

export function listExpenses(): Expense[] {
  const rows = database.prepare('SELECT * FROM expenses ORDER BY date DESC').all() as Record<string, string | number | null>[]
  return rows.map((row) => ({
    id: String(row.id),
    date: String(row.date),
    category: String(row.category),
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    description: String(row.description ?? ''),
    amount: Number(row.amount),
    supplier: String(row.supplier ?? ''),
    receipt: String(row.receipt ?? ''),
    status: row.status as Expense['status'],
  }))
}

export function listNotifications(): NotificationItem[] {
  const rows = database.prepare('SELECT * FROM notifications ORDER BY date DESC').all() as Record<string, string | number>[]
  return rows.map((row) => ({ id: String(row.id), title: String(row.title), body: String(row.body), date: String(row.date), read: Boolean(row.read) }))
}

export function listFaqs(): Faq[] {
  return (database.prepare('SELECT id, question, answer, topic FROM faqs').all() as Faq[]).map((row) => ({ ...row }))
}

export function listAuditLogs(): AuditLog[] {
  return (database.prepare('SELECT id, user, action, resource, date, time, details FROM audit_logs ORDER BY date DESC').all() as AuditLog[]).map((row) => ({ ...row }))
}

export function listDonationSeries() {
  return (database.prepare('SELECT month, amount FROM donation_series').all() as { month: string; amount: number }[]).map((row) => ({ month: row.month, amount: Number(row.amount) }))
}

export function listLevelSplit() {
  return (database.prepare('SELECT name, value FROM level_split').all() as { name: string; value: number }[]).map((row) => ({ name: String(row.name), value: Number(row.value) }))
}

export function getImpactStats() {
  const row = database.prepare('SELECT * FROM impact_stats WHERE id = 1').get() as Record<string, number>
  return {
    childrenSupported: row.children_supported,
    fundsRaised: row.funds_raised,
    schoolsReached: row.schools_reached,
    campaignsCompleted: row.campaigns_completed,
    scholarships: row.scholarships,
    books: row.books,
    uniforms: row.uniforms,
    thisMonth: row.this_month,
    activeCampaigns: row.active_campaigns,
  }
}

export function listSettings() {
  const rows = database.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}
