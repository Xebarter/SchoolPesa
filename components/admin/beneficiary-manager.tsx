'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageIntro, Panel, StatusPill, TableFrame, actionClass, tdClass, thClass, trClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { deleteBeneficiary } from '@/lib/admin-actions'
import { saveBeneficiary } from '@/lib/actions'
import { formatUGX } from '@/lib/format'
import type { Beneficiary, EducationLevel } from '@/lib/types'

const empty = { displayName: '', level: 'Primary' as EducationLevel, school: '', location: '', story: '', needs: '', target: '1000000', publicProfile: true, publicImage: true, storyVisible: true }

export function BeneficiaryManager({ initial }: { initial: Beneficiary[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => { setRows(initial) }, [initial])

  async function save() {
    if (pending) return
    setPending(true)
    setError('')
    try {
      await saveBeneficiary({
        id: editing ?? undefined,
        displayName: form.displayName || 'Learner',
        level: form.level,
        school: form.school,
        location: form.location,
        needs: form.needs,
        story: form.story,
        target: Number(form.target) || 0,
        publicProfile: form.publicProfile,
        publicImage: form.publicImage,
        storyVisible: form.storyVisible,
      })
      setEditing(null)
      setForm(empty)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The learner could not be saved.')
    } finally {
      setPending(false)
    }
  }

  async function remove(id: string) {
    setError('')
    try {
      await deleteBeneficiary(id)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The learner could not be removed.')
    }
  }

  return (
    <div>
      <PageIntro title="Beneficiaries" description="Learner profiles used for sponsorship, with privacy controls for the public site." />
      <Panel title={editing ? 'Edit learner' : 'Add a learner'} description="Names, photos and stories stay private until you mark them public." className="mt-6" padded>
        {error ? <p className="mb-3 text-sm text-destructive" role="alert">{error}</p> : null}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void save() }}>
          <Label>Display name<Input className="mt-2" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required /></Label>
          <Label>Education level
            <Select className="mt-2" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as EducationLevel })}>
              {['Nursery', 'Primary', 'Secondary', 'University'].map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Label>
          <Label>School / program<Input className="mt-2" value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} /></Label>
          <Label>General location<Input className="mt-2" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></Label>
          <Label>Target<Input className="mt-2" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} /></Label>
          <Label>Needs<Input className="mt-2" value={form.needs} onChange={(event) => setForm({ ...form, needs: event.target.value })} /></Label>
          <Label className="md:col-span-2">Story<Textarea className="mt-2" value={form.story} onChange={(event) => setForm({ ...form, story: event.target.value })} /></Label>
          <div className="grid gap-2 md:col-span-2 sm:grid-cols-3">
            <label className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm"><span>Public profile</span><input className="size-4 accent-forest" type="checkbox" checked={form.publicProfile} onChange={(event) => setForm({ ...form, publicProfile: event.target.checked })} /></label>
            <label className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm"><span>Public image</span><input className="size-4 accent-forest" type="checkbox" checked={form.publicImage} onChange={(event) => setForm({ ...form, publicImage: event.target.checked })} /></label>
            <label className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm"><span>Story visible</span><input className="size-4 accent-forest" type="checkbox" checked={form.storyVisible} onChange={(event) => setForm({ ...form, storyVisible: event.target.checked })} /></label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="rounded-full bg-brand text-white shadow-none hover:bg-brand-deep" disabled={pending}>{pending ? 'Saving…' : editing ? 'Update beneficiary' : 'Save beneficiary'}</Button>
            {editing && <Button type="button" variant="outline" className="rounded-full" onClick={() => { setEditing(null); setForm(empty) }}>Cancel</Button>}
          </div>
        </form>
      </Panel>
      <div className="mt-6">
        <TableFrame>
          <table className="w-full min-w-[52rem] text-left">
            <thead className="border-b border-line bg-[#f7faf8]"><tr>{['Learner', 'Level', 'School', 'Target', 'Raised', 'Status', 'Visibility', ''].map((heading) => <th key={heading || 'actions'} className={thClass}>{heading}</th>)}</tr></thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className={trClass}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      {item.publicImage ? (
                        <Image src={item.image} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
                      ) : (
                        <span className="flex size-10 items-center justify-center rounded-full bg-mist text-xs font-semibold text-forest">••</span>
                      )}
                      <div>
                        <p className="font-semibold">{item.displayName}</p>
                        <p className="text-xs text-sage">{item.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>{item.level}</td>
                  <td className={tdClass}>{item.school}</td>
                  <td className={tdClass}>{formatUGX(item.target)}</td>
                  <td className={`${tdClass} font-semibold`}>{formatUGX(item.raised)}</td>
                  <td className={tdClass}><StatusPill value={item.status} /></td>
                  <td className={tdClass}><StatusPill value={item.publicProfile ? 'Public' : 'Private'} /></td>
                  <td className={tdClass}>
                    <div className="flex justify-end gap-1">
                      <Link href={`/sponsor/${item.id}`} className={actionClass}>View</Link>
                      <button type="button" className={actionClass} onClick={() => { setEditing(item.id); setForm({ displayName: item.displayName, level: item.level, school: item.school, location: item.location, story: item.story, needs: item.needs, target: String(item.target), publicProfile: item.publicProfile, publicImage: item.publicImage, storyVisible: item.storyVisible }) }}>Edit</button>
                      <button type="button" className={actionClass} onClick={() => void remove(item.id)}>Delete</button>
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
