'use client'

import { useState } from 'react'
import { PageIntro, Panel, StatusPill, TableFrame, actionClass, tdClass, thClass, trClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatDate } from '@/lib/format'
import type { Story } from '@/lib/types'

export function StoryEditor({ initial }: { initial: Story[] }) {
  const [rows, setRows] = useState(initial)
  const [form, setForm] = useState({ title: '', category: 'Success Stories', body: '', status: 'draft' as Story['status'] })
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <PageIntro title="Stories" description="Draft and publish impact stories. The body field stands in for a rich-text editor." />
      <Panel title="Write a story" className="mt-6" padded>
        <form className="grid gap-4" onSubmit={(event) => {
          event.preventDefault()
          setRows((current) => [{ id: `st-${Date.now()}`, slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: form.title, excerpt: form.body.slice(0, 140), body: form.body, category: form.category, author: 'School Pesa', date: '2026-10-03', image: '/school-pesa-hero.png', gallery: [], status: form.status, views: 0 }, ...current])
          setSaved(true)
          setForm({ title: '', category: 'Success Stories', body: '', status: 'draft' })
        }}>
          <div className="grid gap-4 md:grid-cols-2">
            <Label>Title<Input className="mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></Label>
            <Label>Category
              <Select className="mt-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {['Success Stories', 'Scholarships', 'School Requirements', 'Community', 'Students', 'Events'].map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
          </div>
          <Label>Story<Textarea className="mt-2 min-h-40" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} required /></Label>
          <Label>Status
            <Select className="mt-2 max-w-xs" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Story['status'] })}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </Select>
          </Label>
          <div className="flex items-center gap-3">
            <Button type="submit" className="rounded-full bg-forest">Save story</Button>
            {saved && <p role="status" className="text-sm text-forest">Story saved in this session.</p>}
          </div>
        </form>
      </Panel>
      <div className="mt-6">
        <TableFrame>
          <table className="w-full min-w-[44rem] text-left">
            <thead className="border-b border-line bg-[#f7faf8]"><tr>{['Title', 'Category', 'Author', 'Status', 'Published', 'Views', ''].map((heading) => <th key={heading || 'actions'} className={thClass}>{heading}</th>)}</tr></thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className={trClass}>
                  <td className={`${tdClass} font-semibold`}>{item.title}</td>
                  <td className={tdClass}>{item.category}</td>
                  <td className={tdClass}>{item.author}</td>
                  <td className={tdClass}><StatusPill value={item.status} /></td>
                  <td className={`${tdClass} text-sage`}>{formatDate(item.date)}</td>
                  <td className={tdClass}>{item.views.toLocaleString()}</td>
                  <td className={tdClass}>
                    <button type="button" className={actionClass} onClick={() => setRows((current) => current.map((row) => row.id === item.id ? { ...row, status: row.status === 'published' ? 'draft' : 'published' } : row))}>
                      {item.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </div>
    </div>
  )
}
