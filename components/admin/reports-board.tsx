'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatUGX, percentOf } from '@/lib/format'
import type { Beneficiary, Campaign, Donation, DonationStatus, Expense } from '@/lib/types'
import { cn } from '@/lib/utils'

const presets = ['This month', 'This quarter', 'This year', 'All time', 'Custom'] as const
type Preset = (typeof presets)[number]

const statusOrder: DonationStatus[] = ['Successful', 'Processing', 'Pending', 'Failed', 'Refunded', 'Cancelled']
const statusColor: Record<string, string> = {
  Successful: '#1b4f78',
  Processing: '#8aabc2',
  Pending: '#c4a46a',
  Failed: '#8d4b38',
  Refunded: '#8d6b62',
  Cancelled: '#9aa3a8',
}
const palette = ['#1b4f78', '#3d6f96', '#8aabc2', '#c4a46a', '#1e3a32', '#8d4b38']

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
  const [preset, setPreset] = useState<Preset>('This year')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')

  const today = kampalaToday()
  const gifts = useMemo(() => donations.filter((item) => inRange(item.date, preset, from, to, today)), [donations, preset, from, to, today])
  const costs = useMemo(() => expenses.filter((item) => inRange(item.date, preset, from, to, today)), [expenses, preset, from, to, today])
  const confirmed = gifts.filter((item) => item.status === 'Successful')
  const raised = confirmed.reduce((sum, item) => sum + item.amount, 0)
  const spent = costs.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const approved = costs.filter((item) => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0)
  const donors = new Set(confirmed.filter((item) => item.email).map((item) => item.email.toLowerCase()))
  const average = confirmed.length ? Math.round(raised / confirmed.length) : 0
  const success = gifts.length ? Math.round((confirmed.length / gifts.length) * 100) : 0
  const repeat = repeatDonors(confirmed)

  const trend = useMemo(() => buildTrend(confirmed), [confirmed])
  const byStatus = statusOrder.map((status) => ({ name: status, value: gifts.filter((item) => item.status === status).length })).filter((item) => item.value > 0)
  const byMethod = groupSum(confirmed, (item) => item.method || 'Unspecified')
  const byTarget = groupSum(confirmed, (item) => labelTarget(item.supportTarget))
  const byCampaign = campaignGifts(confirmed, campaigns)
  const byExpense = groupSum(costs, (item) => item.category || 'Other')
  const byLevel = levelRaised(beneficiaries)
  const topDonors = donorTotals(confirmed).slice(0, 5)
  const campaignRows = campaigns
    .map((item) => ({ ...item, period: byCampaign.find((row) => row.id === item.id)?.amount ?? 0 }))
    .sort((a, b) => b.raised - a.raised)

  const stats = [
    { label: 'Confirmed', value: formatUGX(raised), hint: `${confirmed.length} successful gifts` },
    { label: 'Average gift', value: formatUGX(average), hint: `${donors.size} donors` },
    { label: 'Paid out', value: formatUGX(spent), hint: approved ? `${formatUGX(approved)} still open` : 'No open allocations' },
    { label: 'Net', value: money(raised - spent), hint: `${success}% of gifts confirmed` },
  ]

  function exportReport(report: string, kind: 'CSV' | 'Excel' | 'PDF') {
    const rows = rowsFor(report, gifts, costs, campaigns, beneficiaries, impact, preset, from, to, today)
    const stamp = preset === 'Custom' ? `${from || 'start'}-to-${to || 'end'}` : preset.toLowerCase().replace(/\s+/g, '-')
    if (kind === 'PDF') {
      const popup = window.open('', '_blank', 'noopener,noreferrer')
      if (!popup) {
        setMessage('Allow pop-ups to print this report.')
        return
      }
      const body = rows.map((row, index) => `<tr>${row.map((cell) => `<${index === 0 ? 'th' : 'td'}>${escapeHtml(cell)}</${index === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('')
      popup.document.write(`<!doctype html><html><head><title>${escapeHtml(report)}</title><style>body{font-family:Georgia,serif;color:#161d24;padding:32px}h1{font-size:28px;margin:0}p{color:#66727c}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border-bottom:1px solid #e4ddd4;text-align:left;padding:8px 10px;font-size:13px}th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#66727c}</style></head><body><h1>${escapeHtml(report)}</h1><p>School Pesa · ${escapeHtml(periodLabel(preset, from, to))}</p><table>${body}</table><script>print()<\/script></body></html>`)
      popup.document.close()
      setMessage(`${report} is ready to print.`)
      return
    }
    if (kind === 'Excel') {
      const html = `<html><head><meta charset="utf-8"></head><body><table>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</table></body></html>`
      downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), `school-pesa-${report.toLowerCase()}-${stamp}.xls`)
    } else {
      const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')}`
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `school-pesa-${report.toLowerCase()}-${stamp}.csv`)
    }
    setMessage(`${report} downloaded. ${Math.max(rows.length - 1, 0)} rows.`)
  }

  return (
    <div className="mx-auto min-w-0 max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Finance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-ink sm:text-5xl">Reports</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-sage">Giving, allocations, and campaign progress. Figures follow the gifts and expenses on record for {periodLabel(preset, from, to).toLowerCase()}.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Report period">
            {presets.map((item) => (
              <button key={item} type="button" role="tab" aria-selected={preset === item} onClick={() => setPreset(item)} className={cn('h-10 shrink-0 rounded-full px-3 text-sm font-semibold', preset === item ? 'bg-forest text-white' : 'border border-line bg-white text-ink')}>{item}</button>
            ))}
          </div>
          {preset === 'Custom' ? (
            <div className="grid grid-cols-2 gap-2">
              <Input aria-label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              <Input aria-label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
          ) : null}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 border border-line bg-white lg:grid-cols-4" aria-label="Report summary">
        {stats.map((item) => (
          <div key={item.label} className="border-b border-line p-4 odd:border-r sm:p-5 lg:border-b-0 lg:border-r lg:last:border-r-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-.04em] text-ink sm:text-3xl">{item.value}</p>
            <p className="mt-1 text-xs leading-5 text-sage">{item.hint}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.7fr)]">
        <Panel title="Giving over time" detail="Confirmed gifts, grouped by month.">
          {trend.length ? <TrendChart data={trend} /> : <Empty label="No confirmed gifts in this period." />}
        </Panel>
        <Panel title="Gift outcomes" detail={`${gifts.length} gifts · ${repeat} donors gave more than once.`}>
          {byStatus.length ? <StatusChart data={byStatus} /> : <Empty label="No gifts in this period." />}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="How gifts arrive" detail="Confirmed amount by payment method.">
          {byMethod.length ? <HorizontalBars data={byMethod} /> : <Empty label="No confirmed gifts." />}
        </Panel>
        <Panel title="Where gifts go" detail="Campaign, learner, or general support.">
          {byTarget.length ? <HorizontalBars data={byTarget} /> : <Empty label="No confirmed gifts." />}
        </Panel>
        <Panel title="Allocations" detail="Expenses in this period, by category.">
          {byExpense.length ? <HorizontalBars data={byExpense} /> : <Empty label="No expenses in this period." />}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <Panel title="Campaigns in this period" detail="Confirmed gifts received while the period was open.">
          {byCampaign.length ? <CampaignCompare data={byCampaign.slice(0, 6)} /> : <Empty label="No campaign gifts in this period." />}
        </Panel>
        <Panel title="Learners by level" detail={`${impact.childrenSupported.toLocaleString()} children supported · ${impact.schoolsReached.toLocaleString()} schools.`}>
          {byLevel.length ? <LevelBars data={byLevel} /> : <Empty label="No learners on record." />}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="min-w-0 overflow-hidden border border-line bg-white">
          <header className="border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Campaign progress</h2>
            <p className="mt-1 text-xs text-sage">Lifetime raised against target. Period gifts are the amount confirmed in the selected dates.</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">
                  {['Campaign', 'Status', 'Period', 'Raised', 'Target', 'Progress'].map((heading) => <th key={heading} className="px-4 py-3 sm:px-5">{heading}</th>)}
                </tr>
              </thead>
              <tbody>
                {campaignRows.map((item) => {
                  const progress = percentOf(item.raised, item.target)
                  return (
                    <tr key={item.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-sm font-semibold text-ink sm:px-5">{item.title}</td>
                      <td className="px-4 py-3 text-sm capitalize text-sage sm:px-5">{item.status}</td>
                      <td className="px-4 py-3 text-sm text-ink sm:px-5">{formatUGX(item.period)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-ink sm:px-5">{formatUGX(item.raised)}</td>
                      <td className="px-4 py-3 text-sm text-sage sm:px-5">{formatUGX(item.target)}</td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-mist"><div className="h-full bg-brand" style={{ width: `${progress}%` }} /></div>
                          <span className="text-xs font-semibold text-ink">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="border border-line bg-white">
          <header className="border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Leading donors</h2>
            <p className="mt-1 text-xs text-sage">Named donors in this period. Anonymous gifts stay out of this list.</p>
          </header>
          {topDonors.length ? (
            <ol className="divide-y divide-line">
              {topDonors.map((item, index) => (
                <li key={item.email} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className="w-5 text-xs font-semibold text-sage">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
                    <span className="block truncate text-xs text-sage">{item.gifts} gift{item.gifts === 1 ? '' : 's'}</span>
                  </span>
                  <span className="text-sm font-semibold text-ink">{formatUGX(item.amount)}</span>
                </li>
              ))}
            </ol>
          ) : <Empty label="No named donors in this period." />}
          <div className="grid grid-cols-3 border-t border-line">
            {[
              ['Scholarships', impact.scholarships.toLocaleString()],
              ['Books', impact.books.toLocaleString()],
              ['Uniforms', impact.uniforms.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="border-r border-line p-4 last:border-r-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{label}</p>
                <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 border border-line bg-white">
        <header className="border-b border-line px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold text-ink">Downloads</h2>
          <p className="mt-1 text-xs leading-5 text-sage">Each file uses the period selected above. Spreadsheet opens in Excel. PDF opens a print view.</p>
        </header>
        <ul className="divide-y divide-line">
          {[
            ['Donations', 'Gifts, method, status, and reference.'],
            ['Campaigns', 'Target, raised, donors, and status.'],
            ['Expenses', 'Allocations, supplier, and receipt.'],
            ['Beneficiaries', 'Learners, level, and progress.'],
            ['Impact', 'Organization totals on record.'],
            ['Donors', 'Named donors and amounts in this period.'],
          ].map(([report, detail]) => (
            <li key={report} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm font-semibold text-ink">{report}</p>
                <p className="mt-0.5 text-xs text-sage">{detail}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex">
                {(['CSV', 'Excel', 'PDF'] as const).map((kind) => (
                  <Button key={kind} type="button" variant="outline" className="h-10 rounded-full" onClick={() => exportReport(report, kind)}>{kind === 'PDF' ? 'Print' : kind}</Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        {message ? <p role="status" className="border-t border-line px-4 py-3 text-sm text-forest sm:px-5">{message}</p> : null}
      </section>
    </div>
  )
}

function Panel({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <section className="border border-line bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-sage">{detail}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Empty({ label }: { label: string }) {
  return <p className="py-10 text-center text-sm text-sage">{label}</p>
}

function money(amount: number) {
  const formatted = formatUGX(Math.abs(amount))
  return amount < 0 ? formatted.replace('UGX ', 'UGX −') : formatted
}

function axisTick(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`
  if (value >= 1_000) return `${Math.round(value / 1000)}k`
  return String(value)
}

function Tip({ active, payload, label }: { active?: boolean; payload?: { value?: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-line bg-white px-3 py-2 text-xs shadow-sm">
      {label ? <p className="font-semibold text-ink">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.name} className="mt-0.5 text-sage">{item.name}: {typeof item.value === 'number' && item.value > 20 ? formatUGX(item.value) : item.value}</p>
      ))}
    </div>
  )
}

function TrendChart({ data }: { data: { label: string; amount: number }[] }) {
  return (
    <div className="h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4ddd4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" interval="preserveStartEnd" />
          <YAxis width={40} tickFormatter={axisTick} tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="amount" stroke="#1b4f78" fill="#d5e1ea" name="Confirmed" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function StatusChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <div>
      <div className="mx-auto h-44 max-w-[14rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={46} outerRadius={68} paddingAngle={2} stroke="none">
              {data.map((entry) => <Cell key={entry.name} fill={statusColor[entry.name] ?? '#8aabc2'} />)}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid gap-1.5">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-ink"><span className="size-2" style={{ background: statusColor[entry.name] }} />{entry.name}</span>
            <span className="font-semibold">{entry.value} · {total ? Math.round((entry.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HorizontalBars({ data }: { data: { name: string; amount: number }[] }) {
  const height = Math.max(140, data.length * 36)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4ddd4" horizontal={false} />
          <XAxis type="number" tickFormatter={axisTick} tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
          <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
          <Tooltip content={<Tip />} />
          <Bar dataKey="amount" fill="#1b4f78" barSize={12} name="Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function CampaignCompare({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4ddd4" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" interval={0} />
          <YAxis width={40} tickFormatter={axisTick} tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
          <Tooltip content={<Tip />} />
          <Bar dataKey="amount" fill="#1b4f78" barSize={18} name="Confirmed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function LevelBars({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e4ddd4" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
            <YAxis width={36} tickFormatter={axisTick} tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
            <Tooltip content={<Tip />} />
            <Bar dataKey="amount" name="Raised" barSize={22}>
              {data.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function kampalaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function inRange(date: string, preset: Preset, from: string, to: string, today: string) {
  const day = date.slice(0, 10)
  if (preset === 'All time') return true
  if (preset === 'This month') return day.startsWith(today.slice(0, 7))
  if (preset === 'This quarter') {
    const month = Number(today.slice(5, 7))
    const startMonth = Math.floor((month - 1) / 3) * 3 + 1
    const start = `${today.slice(0, 4)}-${String(startMonth).padStart(2, '0')}-01`
    return day >= start && day <= today
  }
  if (preset === 'This year') return day.startsWith(today.slice(0, 4))
  if (!from || !to) return true
  return day >= from && day <= to
}

function periodLabel(preset: Preset, from: string, to: string) {
  if (preset === 'Custom') return from && to ? `${showDate(from)} – ${showDate(to)}` : 'a custom range'
  return preset
}

function showDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function labelTarget(value: string) {
  if (value === 'child') return 'Learner'
  if (value === 'general') return 'General'
  return 'Campaign'
}

function groupSum<T>(rows: T[], key: (item: T) => string) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const name = key(row)
    const amount = (row as { amount: number }).amount
    map.set(name, (map.get(name) ?? 0) + amount)
  }
  return [...map.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildTrend(gifts: Donation[]) {
  if (!gifts.length) return []
  const totals = new Map<string, number>()
  for (const gift of gifts) {
    const key = gift.date.slice(0, 7)
    totals.set(key, (totals.get(key) ?? 0) + gift.amount)
  }
  const keys = [...totals.keys()].sort()
  const [startYear, startMonth] = keys[0].split('-').map(Number)
  const [endYear, endMonth] = keys[keys.length - 1].split('-').map(Number)
  const spanYears = startYear !== endYear
  const points: { label: string; amount: number }[] = []
  let year = startYear
  let month = startMonth
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${String(month).padStart(2, '0')}`
    const name = monthNames[month - 1]
    points.push({ label: spanYears ? `${name} ${String(year).slice(2)}` : name, amount: totals.get(key) ?? 0 })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return points
}

function campaignGifts(gifts: Donation[], campaigns: Campaign[]) {
  const names = new Map(campaigns.map((item) => [item.id, item.title]))
  const map = new Map<string, number>()
  for (const gift of gifts) {
    if (!gift.campaignId) continue
    map.set(gift.campaignId, (map.get(gift.campaignId) ?? 0) + gift.amount)
  }
  return [...map.entries()]
    .map(([id, amount]) => ({ id, name: shortName(names.get(id) ?? 'Campaign'), amount }))
    .sort((a, b) => b.amount - a.amount)
}

function shortName(value: string) {
  return value.length > 16 ? `${value.slice(0, 15)}…` : value
}

function levelRaised(beneficiaries: Beneficiary[]) {
  const map = new Map<string, number>()
  for (const item of beneficiaries) map.set(item.level, (map.get(item.level) ?? 0) + item.raised)
  return [...map.entries()].map(([name, amount]) => ({ name, amount }))
}

function donorTotals(gifts: Donation[]) {
  const map = new Map<string, { name: string; email: string; amount: number; gifts: number }>()
  for (const gift of gifts) {
    if (gift.anonymous || !gift.email) continue
    const key = gift.email.toLowerCase()
    const current = map.get(key) ?? { name: gift.donorName, email: gift.email, amount: 0, gifts: 0 }
    current.amount += gift.amount
    current.gifts += 1
    map.set(key, current)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

function repeatDonors(gifts: Donation[]) {
  const counts = new Map<string, number>()
  for (const gift of gifts) {
    if (!gift.email) continue
    const key = gift.email.toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.values()].filter((count) => count > 1).length
}

function rowsFor(report: string, gifts: Donation[], costs: Expense[], campaigns: Campaign[], beneficiaries: Beneficiary[], impact: Impact, preset: Preset, from: string, to: string, today: string) {
  if (report === 'Donations') {
    return [['Date', 'Donor', 'Email', 'Amount', 'Method', 'Status', 'Reference'], ...gifts.map((item) => [item.date, item.anonymous ? 'Anonymous' : item.donorName, item.anonymous ? '' : item.email, String(item.amount), item.method, item.status, item.transactionId])]
  }
  if (report === 'Campaigns') {
    return [['Title', 'Status', 'Target', 'Raised', 'Donors', 'Created'], ...campaigns.filter((item) => preset === 'All time' || inRange(item.createdAt, preset, from, to, today)).map((item) => [item.title, item.status, String(item.target), String(item.raised), String(item.donors), item.createdAt])]
  }
  if (report === 'Expenses') {
    return [['Date', 'Category', 'Description', 'Amount', 'Supplier', 'Receipt', 'Status'], ...costs.map((item) => [item.date, item.category, item.description, String(item.amount), item.supplier, item.receipt, item.status])]
  }
  if (report === 'Beneficiaries') {
    return [['Name', 'Level', 'School', 'Target', 'Raised', 'Status'], ...beneficiaries.map((item) => [item.displayName, item.level, item.school, String(item.target), String(item.raised), item.status])]
  }
  if (report === 'Impact') {
    return [['Children supported', 'Funds raised', 'Schools', 'Campaigns completed', 'Scholarships', 'Books', 'Uniforms', 'This month', 'Active campaigns'], [String(impact.childrenSupported), String(impact.fundsRaised), String(impact.schoolsReached), String(impact.campaignsCompleted), String(impact.scholarships), String(impact.books), String(impact.uniforms), String(impact.thisMonth), String(impact.activeCampaigns)]]
  }
  return [['Name', 'Email', 'Amount', 'Gifts'], ...donorTotals(gifts.filter((item) => item.status === 'Successful')).map((item) => [item.name, item.email, String(item.amount), String(item.gifts)])]
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}
