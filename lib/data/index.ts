import {
  getImpactStats,
  listSettings,
  listAuditLogs,
  listBeneficiaries,
  listCampaigns,
  listDonationSeries,
  listDonations,
  listEvents,
  listExpenses,
  listFaqs,
  listGallery,
  listLevelSplit,
  listNews,
  listNotifications,
  listPartners,
  listStories,
  listTransactions,
  listUsers,
  listVolunteers,
} from '@/lib/db'
import { rolePermissions } from '@/lib/data/people'
import type { Campaign, CampaignStatus, EducationLevel } from '@/lib/types'

export { rolePermissions }

export function getCampaigns() {
  return listCampaigns()
}

export function getCampaignBySlug(slug: string) {
  return listCampaigns().find((campaign) => campaign.slug === slug)
}

export function getCampaignById(id: string) {
  return listCampaigns().find((campaign) => campaign.id === id)
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
  let list = getCampaigns()
  const q = query.q?.trim().toLowerCase()
  if (q) list = list.filter((item) => `${item.title} ${item.summary} ${item.location}`.toLowerCase().includes(q))
  if (query.level) list = list.filter((item) => item.level === query.level)
  if (query.category) list = list.filter((item) => item.category === query.category)
  if (query.status) list = list.filter((item) => item.status === query.status)
  if (query.location) list = list.filter((item) => item.location === query.location)
  if (query.progress === 'under-50') list = list.filter((item) => item.raised / item.target < 0.5)
  if (query.progress === 'over-75') list = list.filter((item) => item.raised / item.target >= 0.75)
  if (query.sort === 'urgent' || query.sort === 'ending') list.sort((a, b) => a.deadline.localeCompare(b.deadline))
  if (query.sort === 'funded') list.sort((a, b) => b.raised / b.target - a.raised / a.target)
  if (query.sort === 'newest' || !query.sort) list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return list
}

export function campaignLevels(): EducationLevel[] {
  return ['Nursery', 'Primary', 'Secondary', 'University']
}

export function campaignCategories() {
  return [...new Set(getCampaigns().map((item) => item.category))]
}

export function campaignLocations() {
  return [...new Set(getCampaigns().map((item) => item.location))]
}

export function campaignStatuses(): CampaignStatus[] {
  return ['draft', 'active', 'paused', 'completed', 'archived']
}

export function getBeneficiaries() {
  return listBeneficiaries()
}

export function getBeneficiary(id: string) {
  return listBeneficiaries().find((item) => item.id === id)
}

export function getStories() {
  return listStories()
}

export function getStory(slug: string) {
  return listStories().find((item) => item.slug === slug)
}

export function relatedStories(slug: string) {
  return listStories().filter((item) => item.slug !== slug).slice(0, 3)
}

export function getNews() {
  return listNews()
}

export function getNewsArticle(slug: string) {
  return listNews().find((item) => item.slug === slug)
}

export function getEvents() {
  return listEvents()
}

export function getGallery() {
  return listGallery()
}

export function getFaqs() {
  return listFaqs()
}

export function getPartners() {
  return listPartners()
}

export function getUsers() {
  return listUsers()
}

export function getVolunteers() {
  return listVolunteers()
}

export function getDonations() {
  return listDonations()
}

export function getTransactions() {
  return listTransactions()
}

export function getExpenses() {
  return listExpenses()
}

export function getNotifications() {
  return listNotifications()
}

export function getAuditLogs() {
  return listAuditLogs()
}

export function getDonationSeries() {
  return listDonationSeries()
}

export function getCampaignBars() {
  return getCampaigns()
    .filter((item) => item.status !== 'draft')
    .map((item) => ({ name: item.title.split(' ').slice(0, 2).join(' '), amount: Math.round(item.raised / 10_000) / 100 }))
}

export function getLevelSplit() {
  return listLevelSplit()
}

export function getImpact() {
  return getImpactStats()
}

export function getSettings() {
  return listSettings()
}

export type { Campaign }
