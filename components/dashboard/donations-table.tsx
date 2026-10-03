'use client'

import { useMemo, useState } from 'react'
import { StatusPill, TableFrame, tdClass, thClass, trClass } from '@/components/admin/ui'
import { EmptyState } from '@/components/states'
import { Input, Select } from '@/components/ui/input'
import { getCampaignById } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'
import type { Donation } from '@/lib/types'

export function DonationsTable({ donations, donorView = false }: { donations: Donation[]; donorView?: boolean }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const rows = useMemo(() => donations.filter((item) => {
    const haystack = `${item.donorName} ${item.transactionId} ${item.campaignId ?? ''}`.toLowerCase()
    if (q && !haystack.includes(q.toLowerCase())) return false
    if (status && item.status !== status) return false
    if (method && item.method !== method) return false
    return true
  }), [donations, q, status, method])

  return (
    <div>
      <div className="mb-4 grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm shadow-forest/5 md:grid-cols-3">
        <Input aria-label="Search donations" placeholder="Search" value={q} onChange={(event) => setQ(event.target.value)} />
        <Select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {['Pending', 'Processing', 'Successful', 'Failed', 'Cancelled', 'Refunded'].map((item) => <option key={item}>{item}</option>)}
        </Select>
        <Select aria-label="Payment method" value={method} onChange={(event) => setMethod(event.target.value)}>
          <option value="">All methods</option>
          {[...new Set(donations.map((item) => item.method))].map((item) => <option key={item}>{item}</option>)}
        </Select>
      </div>
      {note && <p className="mb-3 text-sm text-forest" role="status">{note}</p>}
      {rows.length === 0 ? <EmptyState title="Your donation history will appear here." body={donorView ? 'Gifts you make will be listed with their status and receipt.' : 'No donations match these filters.'} /> : (
        <TableFrame>
          <table className="w-full min-w-[44rem] text-left">
            <thead className="border-b border-line bg-[#f7faf8]">
              <tr>
                {!donorView && <th className={thClass}>Donor</th>}
                <th className={thClass}>Date</th>
                {!donorView && <th className={thClass}>Campaign</th>}
                <th className={thClass}>Amount</th>
                <th className={thClass}>Method</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Reference</th>
                {donorView && <th className={thClass}>Receipt</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className={trClass}>
                  {!donorView && <td className={`${tdClass} font-semibold`}>{item.anonymous ? 'Anonymous' : item.donorName}</td>}
                  <td className={`${tdClass} text-sage`}>{formatDate(item.date)}</td>
                  {!donorView && <td className={tdClass}>{item.campaignId ? getCampaignById(item.campaignId)?.title : item.supportTarget}</td>}
                  <td className={`${tdClass} font-semibold`}>{formatUGX(item.amount)}</td>
                  <td className={tdClass}>{item.method}</td>
                  <td className={tdClass}><StatusPill value={item.status} /></td>
                  <td className={`${tdClass} font-mono text-xs`}>{item.transactionId}</td>
                  {donorView && (
                    <td className={tdClass}>
                      <button type="button" className="rounded-full px-2.5 py-1 text-xs font-semibold text-forest hover:bg-mist" onClick={() => setNote(`Receipt for ${item.transactionId} will download when a payment provider is connected.`)}>Download receipt</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      )}
    </div>
  )
}
