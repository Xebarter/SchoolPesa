import type { AuditLog, Donation, Expense, NotificationItem, PaymentTransaction } from '@/lib/types'

export const donations: Donation[] = [
  { id: 'd1', donorName: 'Sarah Nakato', anonymous: false, email: 'sarah@example.com', phone: '+256 700 000 010', amount: 50000, frequency: 'one-time', campaignId: 'camp-1', supportTarget: 'campaign', method: 'Mobile money', transactionId: 'TX-10021', date: '2026-09-21', status: 'Successful', message: 'For the new term.' },
  { id: 'd2', donorName: 'Anonymous', anonymous: true, email: 'hidden@example.com', phone: '', amount: 100000, frequency: 'monthly', campaignId: 'camp-2', supportTarget: 'campaign', method: 'Card', transactionId: 'TX-10044', date: '2026-09-18', status: 'Successful' },
  { id: 'd3', donorName: 'James Otim', anonymous: false, email: 'james@example.com', phone: '+256 700 000 011', amount: 20000, frequency: 'one-time', beneficiaryId: 'ben-1', supportTarget: 'child', method: 'Mobile money', transactionId: 'TX-10058', date: '2026-09-14', status: 'Processing' },
  { id: 'd4', donorName: 'Lydia Achen', anonymous: false, email: 'lydia@example.com', phone: '+256 700 000 012', amount: 250000, frequency: 'one-time', supportTarget: 'general', method: 'Bank transfer', transactionId: 'TX-10063', date: '2026-09-09', status: 'Pending' },
  { id: 'd5', donorName: 'Peter Mugisha', anonymous: false, email: 'peter@example.com', phone: '+256 700 000 013', amount: 50000, frequency: 'one-time', campaignId: 'camp-3', supportTarget: 'campaign', method: 'Mobile money', transactionId: 'TX-10070', date: '2026-08-30', status: 'Failed' },
  { id: 'd6', donorName: 'Grace Donor', anonymous: false, email: 'grace.donor@example.com', phone: '+256 700 000 014', amount: 100000, frequency: 'one-time', campaignId: 'camp-4', supportTarget: 'campaign', method: 'Card', transactionId: 'TX-10081', date: '2026-08-12', status: 'Refunded' },
]

export const transactions: PaymentTransaction[] = donations.map((donation) => ({
  id: `pt-${donation.id}`,
  donationId: donation.id,
  provider: 'Payment provider',
  reference: donation.transactionId,
  amount: donation.amount,
  status: donation.status,
  date: donation.date,
}))

export const expenses: Expense[] = [
  { id: 'x1', date: '2026-09-18', category: 'Books', campaignId: 'camp-3', description: 'Readers and exercise books', amount: 1_800_000, supplier: 'Kampala Book House', receipt: 'RCP-221', status: 'paid' },
  { id: 'x2', date: '2026-09-02', category: 'Uniforms', campaignId: 'camp-4', description: 'Uniform fabric and tailoring', amount: 960_000, supplier: 'Uniform Co-op', receipt: 'RCP-228', status: 'approved' },
  { id: 'x3', date: '2026-08-20', category: 'Tuition', campaignId: 'camp-2', description: 'Semester fees for 8 students', amount: 4_200_000, supplier: 'Public university', receipt: 'RCP-214', status: 'paid' },
]

export const notifications: NotificationItem[] = [
  { id: 'nt1', title: 'Campaign update', body: 'Back to School 2027 posted: school supplies delivered.', date: '2026-09-18', read: false },
  { id: 'nt2', title: 'Receipt ready to prepare', body: 'Your UGX 50,000 gift to Back to School 2027 is listed in My Donations.', date: '2026-09-21', read: true },
  { id: 'nt3', title: 'Impact story', body: 'A new story was published: From a School Uniform to a University Dream.', date: '2026-09-20', read: false },
]

export const auditLogs: AuditLog[] = [
  { id: 'a1', user: 'John Okello', action: 'created', resource: 'Campaign', date: '2026-10-03', time: '10:42 AM', details: 'John created campaign "Back to School 2027"' },
  { id: 'a2', user: 'Achieng Finance', action: 'approved', resource: 'Expense', date: '2026-10-02', time: '4:15 PM', details: 'Achieng approved expense RCP-228' },
  { id: 'a3', user: 'Rita Content', action: 'published', resource: 'Story', date: '2026-09-20', time: '9:05 AM', details: 'Rita published "From a School Uniform to a University Dream"' },
  { id: 'a4', user: 'Sarah Nakato', action: 'updated', resource: 'Settings', date: '2026-09-12', time: '11:20 AM', details: 'Sarah updated organization contact details' },
]

export const donationSeries = [
  { month: 'Apr', amount: 18 },
  { month: 'May', amount: 22 },
  { month: 'Jun', amount: 31 },
  { month: 'Jul', amount: 28 },
  { month: 'Aug', amount: 36 },
  { month: 'Sep', amount: 42 },
]

export const campaignBars = [
  { name: 'Back to School', amount: 16.85 },
  { name: 'University', amount: 9.4 },
  { name: 'Books', amount: 4.72 },
  { name: 'Uniforms', amount: 2.15 },
]

export const levelSplit = [
  { name: 'Nursery', value: 12 },
  { name: 'Primary', value: 46 },
  { name: 'Secondary', value: 24 },
  { name: 'University', value: 18 },
]

export const impactStats = {
  childrenSupported: 1248,
  fundsRaised: 385_000_000,
  schoolsReached: 34,
  campaignsCompleted: 86,
  scholarships: 420,
  books: 2800,
  uniforms: 1100,
  thisMonth: 24_500_000,
  activeCampaigns: 18,
}
