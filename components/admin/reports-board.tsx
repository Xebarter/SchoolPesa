'use client'

import { useState } from 'react'
import { PageIntro, Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Beneficiary, Campaign, Donation, Expense } from '@/lib/types'

const presets = ['Today', 'This week', 'This month', 'This year', 'Custom'] as const

type Impact = {
  childrenSupported: number
  fundsRaised: number
  schoolsReached: number
  campaignsCompleted: number
  scholarships: number
  books: number
  uniforms: number
  thisMonth: number
  activeCampaigns: number
}

export function ReportsBoard({
  donations,
  campaigns,
  expenses,
  beneficiaries,
  impact,
}: {
  donations: Donation[]
  campaigns: Campaign[]
  expenses: Expense[]
  beneficiaries: Beneficiary[]
  impact: Impact
}) {
  const [preset, setPreset] = useState<(typeof presets)[number]>('This month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')

  function rowsFor(report: string) {
    if (report === 'Donations') {
      return [['Date', 'Donor', 'Email', 'Amount', 'Method', 'Status', 'Reference'], ...donations.filter((item) => inRange(item.date, preset, from, to)).map((item) => [item.date, item.donorName, item.email, String(item.amount), item.method, item.status, item.transactionId])]
    }
    if (report === 'Campaigns') {
      return [['Title', 'Status', 'Target', 'Raised', 'Donors', 'Created'], ...campaigns.filter((item) => inRange(item.createdAt, preset, from, to)).map((item) => [item.title, item.status, String(item.target), String(item.raised), String(item.donors), item.createdAt])]
    }
    if (report === 'Expenses') {
      return [['Date', 'Category', 'Description', 'Amount', 'Supplier', 'Receipt', 'Status'], ...expenses.filter((item) => inRange(item.date, preset, from, to)).map((item) => [item.date, item.category, item.description, String(item.amount), item.supplier, item.receipt, item.status])]
    }
    if (report === 'Beneficiaries') {
      return [['Name', 'Level', 'School', 'Target', 'Raised', 'Status'], ...beneficiaries.map((item) => [item.displayName, item.level, item.school, String(item.target), String(item.raised), item.status])]
    }
    if (report === 'Impact') {
      return [['Children supported', 'Funds raised', 'Schools', 'Campaigns completed', 'Scholarships', 'Books', 'Uniforms', 'This month', 'Active campaigns'], [String(impact.childrenSupported), String(impact.fundsRaised), String(impact.schoolsReached), String(impact.campaignsCompleted), String(impact.scholarships), String(impact.books), String(impact.uniforms), String(impact.thisMonth), String(impact.activeCampaigns)]]
    }
    const donors = new Map<string, { name: string; email: string; amount: number }>()
    for (const item of donations.filter((gift) => !gift.anonymous && inRange(gift.date, preset, from, to))) {
      const current = donors.get(item.email) ?? { name: item.donorName, email: item.email, amount: 0 }
      current.amount += item.amount
      donors.set(item.email, current)
    }
    return [['Name', 'Email', 'Amount'], ...[...donors.values()].map((item) => [item.name, item.email, String(item.amount)])]
  }

  function exportReport(report: string, kind: 'CSV' | 'Excel' | 'PDF') {
    const rows = rowsFor(report)
    const stamp = preset === 'Custom' ? `${from || 'start'}-to-${to || 'end'}` : preset.toLowerCase().replace(/\s+/g, '-')
    if (kind === 'PDF') {
      const popup = window.open('', '_blank', 'noopener,noreferrer')
      if (!popup) {
        setMessage('Allow pop-ups to print this report.')
        return
      }
      const body = rows.map((row, index) => `<tr>${row.map((cell) => `<${index === 0 ? 'th' : 'td'}>${escapeHtml(cell)}</${index === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('')
      popup.document.write(`<!doctype html><html><head><title>${escapeHtml(report)}</title></head><body><h1>${escapeHtml(report)}</h1><p>${escapeHtml(preset)}</p><table border="1" cellpadding="6" cellspacing="0">${body}</table><script>print()<\/script></body></html>`)
      popup.document.close()
      setMessage(`${report} is ready to print for ${preset.toLowerCase()}.`)
      return
    }
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `school-pesa-${report.toLowerCase()}-${stamp}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setMessage(`${report} downloaded for ${preset.toLowerCase()}. ${rows.length - 1} rows.`)
  }

  const reports = [
    ['Donations', 'Gifts, methods and statuses for the selected period.'],
    ['Campaigns', 'Targets, progress and donor counts.'],
    ['Expenses', 'Allocations recorded against campaigns.'],
    ['Beneficiaries', 'Learners, levels and sponsorship progress.'],
    ['Impact', 'Children supported, schools and completed campaigns.'],
    ['Donors', 'Named donors and contact details.'],
  ]

  return (
    <div>
      <PageIntro title="Reports" description="Exports are built from the records currently stored." />
      <div className="mt-6 flex flex-wrap gap-2">
        {presets.map((item) => (
          <button key={item} type="button" onClick={() => setPreset(item)} className={`px-4 py-2 text-sm font-semibold ${preset === item ? 'bg-forest text-white' : 'bg-mist text-ink hover:bg-forest hover:text-white'}`}>{item}</button>
        ))}
      </div>
      {preset === 'Custom' ? (
        <div className="mt-3 flex flex-wrap gap-3">
          <Input aria-label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="max-w-48" />
          <Input aria-label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="max-w-48" />
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {reports.map(([report, detail]) => (
          <Panel key={report} title={report} description={detail} padded>
            <div className="flex flex-wrap gap-2">
              {([['CSV', 'Export CSV'], ['Excel', 'Export Excel'], ['PDF', 'Generate PDF']] as const).map(([kind, label]) => (
                <Button key={kind} variant="outline" className="rounded-full" onClick={() => exportReport(report, kind)}>{label}</Button>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      {message ? <p className="mt-4 bg-mist px-4 py-3 text-sm text-forest" role="status">{message}</p> : null}
    </div>
  )
}

function inRange(date: string, preset: (typeof presets)[number], from: string, to: string) {
  const day = date.slice(0, 10)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  if (preset === 'Today') return day === today
  if (preset === 'This week') return day >= shift(today, -6) && day <= today
  if (preset === 'This month') return day.startsWith(today.slice(0, 7))
  if (preset === 'This year') return day.startsWith(today.slice(0, 4))
  if (!from || !to) return true
  return day >= from && day <= to
}

function shift(iso: string, days: number) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}
