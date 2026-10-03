export type EducationLevel = 'Nursery' | 'Primary' | 'Secondary' | 'University'

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export type DonationStatus = 'Pending' | 'Processing' | 'Successful' | 'Failed' | 'Cancelled' | 'Refunded'

export type SupportTarget = 'campaign' | 'child' | 'general'

export type DonationFrequency = 'one-time' | 'monthly'

export type Role = 'Super Admin' | 'Finance Admin' | 'Campaign Manager' | 'Content Manager' | 'Auditor' | 'Viewer'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
}

export type CampaignUpdate = {
  id: string
  title: string
  body: string
  date: string
  image?: string
}

export type Campaign = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  story: string
  category: string
  level: EducationLevel
  location: string
  status: CampaignStatus
  target: number
  raised: number
  donors: number
  deadline: string
  createdAt: string
  image: string
  gallery: string[]
  video?: string
  beneficiaryId?: string
  seoTitle: string
  seoDescription: string
  updates: CampaignUpdate[]
}

export type BeneficiaryUpdate = {
  title: string
  body: string
  date: string
}

export type Beneficiary = {
  id: string
  displayName: string
  level: EducationLevel
  school: string
  location: string
  story: string
  needs: string
  target: number
  raised: number
  image: string
  publicProfile: boolean
  publicImage: boolean
  storyVisible: boolean
  status: 'active' | 'paused' | 'completed'
  updates: BeneficiaryUpdate[]
}

export type Donation = {
  id: string
  donorName: string
  anonymous: boolean
  email: string
  phone: string
  amount: number
  frequency: DonationFrequency
  campaignId?: string
  beneficiaryId?: string
  supportTarget: SupportTarget
  method: string
  transactionId: string
  date: string
  status: DonationStatus
  message?: string
}

export type PaymentTransaction = {
  id: string
  donationId: string
  provider: string
  reference: string
  amount: number
  status: DonationStatus
  date: string
}

export type Story = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  author: string
  date: string
  image: string
  gallery: string[]
  campaignId?: string
  beneficiaryId?: string
  status: 'draft' | 'published'
  views: number
}

export type GalleryItem = {
  id: string
  src: string
  alt: string
  caption: string
  category: string
  campaignId?: string
  storyId?: string
}

export type NewsArticle = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  date: string
  image: string
}

export type EventItem = {
  id: string
  name: string
  date: string
  time: string
  location: string
  description: string
  image: string
}

export type Partner = {
  id: string
  name: string
  logoUrl?: string
}

export type Volunteer = {
  id: string
  name: string
  email: string
  phone: string
  skills: string
  interest: string
  availability: string
  message: string
  status: 'new' | 'reviewing' | 'accepted'
}

export type Expense = {
  id: string
  date: string
  category: string
  campaignId?: string
  description: string
  amount: number
  supplier: string
  receipt: string
  status: 'recorded' | 'approved' | 'paid'
}

export type NotificationItem = {
  id: string
  title: string
  body: string
  date: string
  read: boolean
}

export type Faq = {
  id: string
  question: string
  answer: string
  topic: string
}

export type AuditLog = {
  id: string
  user: string
  action: string
  resource: string
  date: string
  time: string
  details: string
}

export type CheckoutDraft = {
  amount: number
  frequency: DonationFrequency
  supportTarget: SupportTarget
  campaignId?: string
  beneficiaryId?: string
  name: string
  email: string
  phone: string
  message: string
  anonymous: boolean
}
