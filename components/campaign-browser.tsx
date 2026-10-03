'use client'

import { useRouter } from 'next/navigation'
import { CampaignCard } from '@/components/campaign-card'
import { EmptyState } from '@/components/states'
import { Input, Select } from '@/components/ui/input'
import type { CampaignQuery } from '@/lib/data'
import type { Campaign } from '@/lib/types'

const pageSize = 6

export function CampaignBrowser({
  campaigns,
  query,
  levels,
  categories,
  locations,
  total,
}: {
  campaigns: Campaign[]
  query: CampaignQuery
  levels: string[]
  categories: string[]
  locations: string[]
  total: number
}) {
  const router = useRouter()
  const current = Math.max(1, Number(query.page || 1))
  const start = (current - 1) * pageSize
  const visible = campaigns.slice(start, start + pageSize)
  const pages = Math.max(1, Math.ceil(campaigns.length / pageSize))

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams()
    const merged = { ...query, ...patch, page: patch.page ?? '1' }
    Object.entries(merged).forEach(([key, value]) => {
      if (value) next.set(key, value)
    })
    router.push(`/campaigns?${next.toString()}`)
  }

  return (
    <div className="mt-10">
      <form className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3 lg:grid-cols-6" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); update({ q: String(data.get('q') || '') }) }}>
        <div className="flex gap-2">
          <Input aria-label="Search campaigns" name="q" placeholder="Search" defaultValue={query.q} />
          <button type="submit" className="rounded-xl bg-forest px-3 text-sm font-semibold text-white">Search</button>
        </div>
        <Select aria-label="Education level" value={query.level ?? ''} onChange={(event) => update({ level: event.target.value })}>
          <option value="">Education level</option>
          {levels.map((level) => <option key={level}>{level}</option>)}
        </Select>
        <Select aria-label="Category" value={query.category ?? ''} onChange={(event) => update({ category: event.target.value })}>
          <option value="">Category</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Select aria-label="Status" value={query.status ?? ''} onChange={(event) => update({ status: event.target.value })}>
          <option value="">Status</option>
          {['active', 'completed', 'paused', 'draft', 'archived'].map((status) => <option key={status}>{status}</option>)}
        </Select>
        <Select aria-label="Location" value={query.location ?? ''} onChange={(event) => update({ location: event.target.value })}>
          <option value="">Location</option>
          {locations.map((location) => <option key={location}>{location}</option>)}
        </Select>
        <Select aria-label="Sort" value={query.sort ?? 'newest'} onChange={(event) => update({ sort: event.target.value })}>
          <option value="newest">Newest</option>
          <option value="urgent">Most urgent</option>
          <option value="funded">Most funded</option>
          <option value="ending">Ending soon</option>
        </Select>
        <Select aria-label="Funding progress" className="lg:col-span-2" value={query.progress ?? ''} onChange={(event) => update({ progress: event.target.value })}>
          <option value="">Funding progress</option>
          <option value="under-50">Under 50%</option>
          <option value="over-75">75% or more</option>
        </Select>
      </form>
      <p className="mt-4 text-sm text-sage">{total} campaigns · showing {visible.length}</p>
      {visible.length === 0 ? (
        <div className="mt-6"><EmptyState title="No campaigns found" body="Try a different search or clear a filter." /></div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
        </div>
      )}
      {pages > 1 && (
        <div className="mt-8 flex gap-2">
          {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
            <button key={number} type="button" onClick={() => update({ page: String(number) })} className={`size-10 rounded-full border text-sm font-semibold ${number === current ? 'border-forest bg-forest text-white' : 'border-line'}`}>
              {number}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
