import { campaigns } from '@/lib/data/campaigns'
import { faqs, events, gallery, news, stories } from '@/lib/data/content'
import { auditLogs, campaignBars, donationSeries, donations, expenses, impactStats, levelSplit, notifications, transactions } from '@/lib/data/giving'
import { beneficiaries, partners, rolePermissions, users, volunteers } from '@/lib/data/people'
import type { Campaign, CampaignStatus, EducationLevel } from '@/lib/types'

export * from '@/lib/data/campaigns'
export * from '@/lib/data/people'
export * from '@/lib/data/content'
export * from '@/lib/data/giving'

export function getCampaigns() {
  return campaigns
}

export function getCampaignBySlug(slug: string) {
  return campaigns.find((campaign) => campaign.slug === slug)
}

export function getCampaignById(id: string) {
  return campaigns.find((campaign) => campaign.id === id)
}

export type CampaignQuery = {
  q?: string
  level?: string
  category?: string
  status?: string
  location?: string
  progress?: string
  sort?: string
  page?: string
}

export function queryCampaigns(query: CampaignQuery) {
  let list = [...campaigns]
  const q = query.q?.trim().toLowerCase()
  if (q) list = list.filter((item) => `${item.title} ${item.summary} ${item.location}`.toLowerCase().includes(q))
  if (query.level) list = list.filter((item) => item.level === query.level)
  if (query.category) list = list.filter((item) => item.category === query.category)
  if (query.status) list = list.filter((item) => item.status === query.status)
  if (query.location) list = list.filter((item) => item.location === query.location)
  if (query.progress === 'under-50') list = list.filter((item) => item.raised / item.target < 0.5)
  if (query.progress === 'over-75') list = list.filter((item) => item.raised / item.target >= 0.75)
  if (query.sort === 'urgent') list.sort((a, b) => a.deadline.localeCompare(b.deadline))
  if (query.sort === 'funded') list.sort((a, b) => b.raised / b.target - a.raised / a.target)
  if (query.sort === 'ending') list.sort((a, b) => a.deadline.localeCompare(b.deadline))
  if (query.sort === 'newest' || !query.sort) list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return list
}

export function campaignLevels(): EducationLevel[] {
  return ['Nursery', 'Primary', 'Secondary', 'University']
}

export function campaignCategories() {
  return [...new Set(campaigns.map((item) => item.category))]
}

export function campaignLocations() {
  return [...new Set(campaigns.map((item) => item.location))]
}

export function campaignStatuses(): CampaignStatus[] {
  return ['draft', 'active', 'paused', 'completed', 'archived']
}

export function getBeneficiary(id: string) {
  return beneficiaries.find((item) => item.id === id)
}

export function getStory(slug: string) {
  return stories.find((item) => item.slug === slug)
}

export function getNewsArticle(slug: string) {
  return news.find((item) => item.slug === slug)
}

export function relatedStories(slug: string) {
  return stories.filter((item) => item.slug !== slug).slice(0, 3)
}

export { faqs, events, gallery, news, stories, beneficiaries, partners, users, volunteers, donations, expenses, notifications, auditLogs, transactions, impactStats, donationSeries, campaignBars, levelSplit, rolePermissions }
