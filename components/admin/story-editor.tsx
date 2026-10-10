'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PageIntro, Panel, StatusPill, TableFrame, actionClass, tdClass, thClass, trClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { deleteStory, updateStory } from '@/lib/admin-actions'
import { createStory, toggleStoryStatus } from '@/lib/actions'
import { formatDate } from '@/lib/format'
import type { Story } from '@/lib/types'

const blank = { title: '', category: 'Success Stories', body: '', status: 'draft' as Story['status'] }

export function StoryEditor({ initial }: { initial: Story[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => { setRows(initial) }, [initial])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      if (editing) await updateStory(editing, form)
      else await createStory(form)
      setForm(blank)
      setEditing(null)
      setNotice(editing ? 'Story updated.' : 'Story saved.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The story could not be saved.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <PageIntro title="Stories" description="Draft, update and remove impact stories stored for the public site." />
      <Panel title={editing ? 'Edit story' : 'Write a story'} className="mt-6" padded>
        <form className="grid gap-4" onSubmit={save}>
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
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <div className="flex items-center gap-3">
            <Button type="submit" className="rounded-full bg-forest" disabled={pending}>{pending ? 'Saving…' : editing ? 'Update story' : 'Save story'}</Button>
            {editing ? <Button type="button" variant="outline" className="rounded-full" onClick={() => { setEditing(null); setForm(blank) }}>Cancel</Button> : null}
            {notice ? <p role="status" className="text-sm text-forest">{notice}</p> : null}
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
                    <div className="flex justify-end gap-1">
                      <button type="button" className={actionClass} onClick={() => { setEditing(item.id); setForm({ title: item.title, category: item.category, body: item.body, status: item.status }) }}>Edit</button>
                      <button type="button" className={actionClass} onClick={() => {
                        const next = item.status === 'published' ? 'draft' : 'published'
                        void toggleStoryStatus(item.id, next).then(() => router.refresh())
                        setRows((current) => current.map((row) => row.id === item.id ? { ...row, status: next } : row))
                      }}>
                        {item.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" className={actionClass} onClick={() => void deleteStory(item.id).then(() => router.refresh())}>Delete</button>
                    </div>
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
