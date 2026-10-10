'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { PageIntro, Panel, StatusPill, TableFrame, actionClass, tdClass, thClass, trClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { deleteCampaign, updateCampaign } from '@/lib/admin-actions'
import { createCampaign, updateCampaignStatus } from '@/lib/actions'
import { formatUGX, percentOf } from '@/lib/format'
import type { Campaign, CampaignStatus } from '@/lib/types'

const statuses: CampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'archived']

const blank = { title: '', slug: '', summary: '', description: '', category: 'School Fees', level: 'Primary', location: 'Kampala', target: '1000000', start: '2026-10-01', end: '2026-12-31', video: '', seoTitle: '', seoDescription: '', status: 'draft' as CampaignStatus, beneficiaryId: '' }

export function CampaignManager({ initial }: { initial: Campaign[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState(blank)
  useEffect(() => { setRows(initial) }, [initial])

  function setStatus(id: string, status: CampaignStatus) {
    setRows((current) => current.map((item) => item.id === id ? { ...item, status } : item))
    void updateCampaignStatus(id, status).then(() => router.refresh())
  }

  function edit(item: Campaign) {
    setEditing(item.id)
    setOpen(true)
    setError('')
    setForm({
      title: item.title, slug: item.slug, summary: item.summary, description: item.description, category: item.category, level: item.level, location: item.location, target: String(item.target), start: item.createdAt, end: item.deadline, video: item.video ?? '', seoTitle: item.seoTitle, seoDescription: item.seoDescription, status: item.status, beneficiaryId: item.beneficiaryId ?? '',
    })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    const payload = {
      title: form.title, slug: form.slug, summary: form.summary, description: form.description, category: form.category, level: form.level, location: form.location, target: Number(form.target) || 0, deadline: form.end, video: form.video, seoTitle: form.seoTitle, seoDescription: form.seoDescription, status: form.status, beneficiaryId: form.beneficiaryId || undefined,
    }
    try {
      if (editing) await updateCampaign(editing, payload)
      else await createCampaign(payload)
      setOpen(false)
      setEditing(null)
      setForm(blank)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The campaign could not be saved.')
    } finally {
      setPending(false)
    }
  }

  async function remove(campaignId: string) {
    setError('')
    try {
      await deleteCampaign(campaignId)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The campaign could not be removed.')
    }
  }

  return (
    <div>
      <PageIntro title="Campaigns" description="Create, publish and track every fundraising campaign from one list.">
        <Button className="rounded-full bg-forest" onClick={() => { setOpen((value) => !value); setEditing(null); setForm(blank) }}>{open ? 'Close form' : 'Create campaign'}</Button>
      </PageIntro>
      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
      {open && (
        <Panel title={editing ? 'Edit campaign' : 'New campaign'} description="Written to the campaign records." className="mt-6" padded>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
            <Label>Title<Input className="mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></Label>
            <Label>Slug<Input className="mt-2" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></Label>
            <Label className="md:col-span-2">Short description<Textarea className="mt-2" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></Label>
            <Label className="md:col-span-2">Full description<Textarea className="mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Label>
            <Label>Category<Input className="mt-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Label>
            <Label>Education level
              <Select className="mt-2" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>
                {['Nursery', 'Primary', 'Secondary', 'University'].map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Beneficiary id<Input className="mt-2" value={form.beneficiaryId} onChange={(event) => setForm({ ...form, beneficiaryId: event.target.value })} placeholder="ben-1" /></Label>
            <Label>Location<Input className="mt-2" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></Label>
            <Label>Target amount<Input className="mt-2" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} /></Label>
            <Label>Status
              <Select className="mt-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CampaignStatus })}>
                {statuses.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Start date<Input className="mt-2" type="date" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></Label>
            <Label>End date<Input className="mt-2" type="date" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></Label>
            <Label>Cover image<Input className="mt-2" defaultValue="/school-pesa-hero.png" /></Label>
            <Label>Gallery<Input className="mt-2" placeholder="Image URLs" /></Label>
            <Label>Video<Input className="mt-2" value={form.video} onChange={(event) => setForm({ ...form, video: event.target.value })} /></Label>
            <Label>SEO title<Input className="mt-2" value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></Label>
            <Label className="md:col-span-2">SEO description<Textarea className="mt-2" value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} /></Label>
            <Button type="submit" className="rounded-full bg-brand text-white shadow-none hover:bg-brand-deep" disabled={pending}>{pending ? 'Saving…' : editing ? 'Update campaign' : 'Save campaign'}</Button>
          </form>
        </Panel>
      )}
      <div className="mt-6">
      <TableFrame>
        <table className="w-full min-w-[56rem] text-left">
          <thead className="border-b border-line bg-[#f7faf8]">
            <tr>{['Campaign', 'Category', 'Target', 'Raised', 'Progress', 'Donors', 'Status', 'Created', 'Actions'].map((heading) => <th key={heading} className={thClass}>{heading}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const progress = percentOf(item.raised, item.target)
              return (
                <tr key={item.id} className={trClass}>
                  <td className={tdClass}>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-sage">{item.location}</p>
                  </td>
                  <td className={tdClass}>{item.category}</td>
                  <td className={tdClass}>{formatUGX(item.target)}</td>
                  <td className={`${tdClass} font-semibold`}>{formatUGX(item.raised)}</td>
                  <td className={tdClass}>
                    <div className="w-24">
                      <p className="mb-1 text-xs font-semibold">{progress}%</p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-mist">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>{item.donors}</td>
                  <td className={tdClass}><StatusPill value={item.status} /></td>
                  <td className={`${tdClass} text-sage`}>{item.createdAt}</td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      <Link href={`/campaigns/${item.slug}`} className={actionClass}>View</Link>
                      <button type="button" className={actionClass} onClick={() => edit(item)}>Edit</button>
                      <button type="button" className={actionClass} onClick={() => setStatus(item.id, 'active')}>Publish</button>
                      <button type="button" className={actionClass} onClick={() => setStatus(item.id, 'paused')}>Pause</button>
                      <button type="button" className={actionClass} onClick={() => setStatus(item.id, 'completed')}>Complete</button>
                      <button type="button" className={actionClass} onClick={() => setStatus(item.id, 'archived')}>Archive</button>
                      <button type="button" className={actionClass} onClick={() => void remove(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableFrame>
      </div>
    </div>
  )
}
