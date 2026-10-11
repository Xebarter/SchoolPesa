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

export async function getCampaigns() {
  return (await listCampaigns()).filter((campaign) => campaign.status === 'active' || campaign.status === 'completed')
}

export async function getAllCampaigns() {
  return listCampaigns()
}

export async function getCampaignBySlug(slug: string) {
  return (await getCampaigns()).find((campaign) => campaign.slug === slug)
}

export async function getCampaignById(id: string) {
  return (await getCampaigns()).find((campaign) => campaign.id === id)
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

export async function queryCampaigns(query: CampaignQuery) {
  let list = await getCampaigns()
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

export async function campaignCategories() {
  return [...new Set((await getCampaigns()).map((item) => item.category))]
}

export async function campaignLocations() {
  return [...new Set((await getCampaigns()).map((item) => item.location))]
}

export function campaignStatuses(): CampaignStatus[] {
  return ['draft', 'active', 'paused', 'completed', 'archived']
}

export async function getBeneficiaries() {
  return (await listBeneficiaries()).filter((beneficiary) => beneficiary.publicProfile)
}

export async function getAllBeneficiaries() {
  return listBeneficiaries()
}

export async function getBeneficiary(id: string) {
  return (await getBeneficiaries()).find((item) => item.id === id)
}

export async function getStories() {
  return (await listStories()).filter((story) => story.status === 'published')
}

export async function getAllStories() {
  return listStories()
}

export async function getStory(slug: string) {
  return (await getStories()).find((item) => item.slug === slug)
}

export async function relatedStories(slug: string) {
  return (await getStories()).filter((item) => item.slug !== slug).slice(0, 3)
}

export async function getNews() {
  return listNews()
}

export async function getNewsArticle(slug: string) {
  return (await listNews()).find((item) => item.slug === slug)
}

export async function getEvents() {
  return listEvents()
}

export async function getGallery() {
  return listGallery()
}

export async function getFaqs() {
  return listFaqs()
}

export async function getPartners() {
  return listPartners()
}

export async function getUsers() {
  return listUsers()
}

export async function getVolunteers() {
  return listVolunteers()
}

export async function getDonations() {
  return listDonations()
}

export async function getTransactions() {
  return listTransactions()
}

export async function getExpenses() {
  return listExpenses()
}

export async function getNotifications() {
  return listNotifications()
}

export async function getAuditLogs() {
  return listAuditLogs()
}

export async function getDonationSeries() {
  return listDonationSeries()
}

export async function getCampaignBars() {
  return (await getCampaigns())
    .filter((item) => item.status !== 'draft')
    .map((item) => ({ name: item.title.split(' ').slice(0, 2).join(' '), amount: Math.round(item.raised / 10_000) / 100 }))
}

export async function getLevelSplit() {
  return listLevelSplit()
}

export async function getImpact() {
  return getImpactStats()
}

export async function getSettings() {
  return listSettings()
}

export type { Campaign }
