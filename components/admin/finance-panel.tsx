'use client'

import { useState } from 'react'
import { PageIntro, Panel, StatusPill, TableFrame, tdClass, thClass, trClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { getCampaignById } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'
import type { Expense } from '@/lib/types'

const steps = ['Donation', 'Campaign', 'Allocation', 'Expense', 'Impact']

export function FinancePanel({ initial }: { initial: Expense[] }) {
  const [rows, setRows] = useState(initial)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ date: '2026-10-03', category: 'Books', description: '', amount: '', supplier: '', receipt: '', campaignId: 'camp-1' })
  const total = rows.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div>
      <PageIntro title="Allocations" description="Follow a gift from donation through campaign, allocation, expense and impact.">
        <Button className="rounded-full bg-forest" onClick={() => setOpen((value) => !value)}>{open ? 'Close form' : 'Add expense'}</Button>
      </PageIntro>
      <ol className="mt-6 flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">{index + 1}</span>
            <span className="text-sm font-medium text-ink">{step}</span>
            {index < steps.length - 1 ? <span className="mx-1 hidden h-px w-8 bg-line sm:block" aria-hidden /> : null}
          </li>
        ))}
      </ol>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-forest/5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Recorded expenses</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-forest">{rows.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-forest/5 sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Amount on record</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-forest">{formatUGX(total)}</p>
        </div>
      </div>
      {open && (
        <Panel title="New expense" description="Tied to a campaign so the allocation path stays visible." className="mt-6" padded>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => {
            event.preventDefault()
            setRows((current) => [{ id: `x-${Date.now()}`, date: form.date, category: form.category, campaignId: form.campaignId, description: form.description, amount: Number(form.amount) || 0, supplier: form.supplier, receipt: form.receipt || 'RCP-NEW', status: 'recorded' }, ...current])
            setOpen(false)
          }}>
            <Label>Date<Input className="mt-2" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></Label>
            <Label>Category<Input className="mt-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Label>
            <Label>Campaign
              <Select className="mt-2" value={form.campaignId} onChange={(event) => setForm({ ...form, campaignId: event.target.value })}>
                <option value="camp-1">Back to School 2027</option>
                <option value="camp-2">University Dreams</option>
                <option value="camp-3">Books for 100 Children</option>
                <option value="camp-4">School Uniforms</option>
              </Select>
            </Label>
            <Label>Amount<Input className="mt-2" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></Label>
            <Label>Description<Input className="mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></Label>
            <Label>Supplier<Input className="mt-2" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} /></Label>
            <Label>Receipt<Input className="mt-2" value={form.receipt} onChange={(event) => setForm({ ...form, receipt: event.target.value })} /></Label>
            <Button type="submit" className="rounded-full bg-brand text-white shadow-none hover:bg-brand-deep">Save expense</Button>
          </form>
        </Panel>
      )}
      <div className="mt-6">
        <TableFrame>
          <table className="w-full min-w-[52rem] text-left">
            <thead className="border-b border-line bg-[#f7faf8]"><tr>{['Date', 'Category', 'Campaign', 'Description', 'Amount', 'Supplier', 'Receipt', 'Status'].map((heading) => <th key={heading} className={thClass}>{heading}</th>)}</tr></thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className={trClass}>
                  <td className={`${tdClass} text-sage`}>{formatDate(item.date)}</td>
                  <td className={tdClass}>{item.category}</td>
                  <td className={tdClass}>{item.campaignId ? getCampaignById(item.campaignId)?.title : '—'}</td>
                  <td className={`${tdClass} font-medium`}>{item.description}</td>
                  <td className={`${tdClass} font-semibold`}>{formatUGX(item.amount)}</td>
                  <td className={tdClass}>{item.supplier}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{item.receipt}</td>
                  <td className={tdClass}><StatusPill value={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </div>
    </div>
  )
}
