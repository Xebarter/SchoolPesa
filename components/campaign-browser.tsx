'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { CampaignCard } from '@/components/campaign-card'
import { EmptyState } from '@/components/states'
import { Input, Select } from '@/components/ui/input'
import type { CampaignQuery } from '@/lib/data'
import type { Campaign } from '@/lib/types'

const pageSize = 6

const statuses = [
  ['active', 'Open'],
  ['completed', 'Completed'],
  ['paused', 'Paused'],
  ['draft', 'Draft'],
  ['archived', 'Archived'],
]

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
  const [lead, ...rest] = visible
  const active = [
    ['q', 'Search', query.q],
    ['level', 'Level', query.level],
    ['category', 'Category', query.category],
    ['status', 'Status', statuses.find(([value]) => value === query.status)?.[1] ?? query.status],
    ['location', 'Location', query.location],
    ['progress', 'Progress', query.progress === 'under-50' ? 'Under 50%' : query.progress === 'over-75' ? '75% or more' : ''],
  ].filter((item) => item[2])

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams()
    const merged = { ...query, ...patch, page: patch.page ?? '1' }
    Object.entries(merged).forEach(([key, value]) => {
      if (value) next.set(key, value)
    })
    const search = next.toString()
    router.push(search ? `/campaigns?${search}` : '/campaigns')
  }

  return (
    <div className="mt-12">
      <div className="bg-mist p-5 sm:p-6">
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); update({ q: String(data.get('q') || '') }) }}>
          <Input aria-label="Search campaigns" name="q" placeholder="Search by name or place" defaultValue={query.q} className="bg-cream" />
          <button type="submit" className="shrink-0 rounded-full bg-forest px-5 text-sm font-semibold text-white">Search</button>
        </form>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Filter label="Education level">
            <Select aria-label="Education level" value={query.level ?? ''} onChange={(event) => update({ level: event.target.value })} className="bg-cream">
              <option value="">All levels</option>
              {levels.map((level) => <option key={level}>{level}</option>)}
            </Select>
          </Filter>
          <Filter label="Category">
            <Select aria-label="Category" value={query.category ?? ''} onChange={(event) => update({ category: event.target.value })} className="bg-cream">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </Select>
          </Filter>
          <Filter label="Location">
            <Select aria-label="Location" value={query.location ?? ''} onChange={(event) => update({ location: event.target.value })} className="bg-cream">
              <option value="">All locations</option>
              {locations.map((location) => <option key={location}>{location}</option>)}
            </Select>
          </Filter>
          <Filter label="Status">
            <Select aria-label="Status" value={query.status ?? ''} onChange={(event) => update({ status: event.target.value })} className="bg-cream">
              <option value="">Any status</option>
              {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </Filter>
          <Filter label="Funding">
            <Select aria-label="Funding progress" value={query.progress ?? ''} onChange={(event) => update({ progress: event.target.value })} className="bg-cream">
              <option value="">Any progress</option>
              <option value="under-50">Under 50%</option>
              <option value="over-75">75% or more</option>
            </Select>
          </Filter>
          <Filter label="Sort">
            <Select aria-label="Sort" value={query.sort ?? 'newest'} onChange={(event) => update({ sort: event.target.value })} className="bg-cream">
              <option value="newest">Newest</option>
              <option value="ending">Ending soon</option>
              <option value="funded">Most funded</option>
              <option value="urgent">Most urgent</option>
            </Select>
          </Filter>
        </div>
        {active.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {active.map(([key, label, value]) => (
              <button key={key} type="button" onClick={() => update({ [key]: '' })} className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink">
                {label}: {value} <span className="text-sage">×</span>
              </button>
            ))}
            <button type="button" onClick={() => router.push('/campaigns')} className="px-2 text-xs font-semibold text-brand">Clear all</button>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-sage">
        {total === 0 ? 'No campaigns match these filters.' : total === 1 ? '1 campaign' : `${total} campaigns`}
        {pages > 1 ? ` · page ${current} of ${pages}` : ''}
      </p>

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No campaigns found" body="Try another search, or clear the filters to see every campaign." />
          <button type="button" onClick={() => router.push('/campaigns')} className="mt-4 text-sm font-semibold text-brand">Clear filters</button>
        </div>
      ) : (
        <div className="mt-8">
          {lead ? <CampaignCard campaign={lead} lead /> : null}
          {rest.length > 0 && (
            <div className="mt-14 grid items-start gap-x-10 gap-y-14 md:grid-cols-2">
              {rest.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
            </div>
          )}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-12 flex items-center gap-2">
          <button type="button" disabled={current === 1} onClick={() => update({ page: String(current - 1) })} className="rounded-full px-4 py-2 text-sm font-semibold text-ink disabled:text-sage">Previous</button>
          {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
            <button key={number} type="button" onClick={() => update({ page: String(number) })} className={`size-10 rounded-full text-sm font-semibold transition-colors ${number === current ? 'bg-forest text-white' : 'bg-mist text-ink hover:bg-forest hover:text-white'}`}>
              {number}
            </button>
          ))}
          <button type="button" disabled={current === pages} onClick={() => update({ page: String(current + 1) })} className="rounded-full px-4 py-2 text-sm font-semibold text-ink disabled:text-sage">Next</button>
        </div>
      )}
    </div>
  )
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-sage">{label}</span>
      {children}
    </label>
  )
}
