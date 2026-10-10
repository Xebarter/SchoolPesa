'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { StatusPill, TableFrame, tdClass, thClass, trClass } from '@/components/admin/ui'
import { EmptyState } from '@/components/states'
import { Input, Select } from '@/components/ui/input'
import { formatDate, formatUGX } from '@/lib/format'
import type { Campaign, Donation, DonationStatus } from '@/lib/types'

const giftStatuses: DonationStatus[] = ['Pending', 'Processing', 'Successful', 'Failed', 'Cancelled', 'Refunded']

export function DonationsTable({ donations, campaigns = [], donorView = false, onUpdateMessage, onDelete, onSetStatus }: { donations: Donation[]; campaigns?: Pick<Campaign, 'id' | 'title'>[]; donorView?: boolean; onUpdateMessage?: (id: string, message: string) => Promise<void>; onDelete?: (id: string) => Promise<void>; onSetStatus?: (id: string, status: DonationStatus) => Promise<void> }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const rows = useMemo(() => donations.filter((item) => {
    const haystack = `${item.donorName} ${item.transactionId} ${item.campaignId ?? ''}`.toLowerCase()
    if (q && !haystack.includes(q.toLowerCase())) return false
    if (status && item.status !== status) return false
    if (method && item.method !== method) return false
    return true
  }), [donations, q, status, method])

  return (
    <div>
      <div className="mb-4 grid gap-3 bg-mist p-3 md:grid-cols-3">
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
                {donorView && <th className={thClass}>Record</th>}
                {!donorView && (onSetStatus || onDelete) && <th className={thClass}>Record</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className={trClass}>
                  {!donorView && <td className={`${tdClass} font-semibold`}>{item.anonymous ? 'Anonymous' : item.donorName}</td>}
                  <td className={`${tdClass} text-sage`}>{formatDate(item.date)}</td>
                  {!donorView && <td className={tdClass}>{item.campaignId ? campaigns.find((campaign) => campaign.id === item.campaignId)?.title : item.supportTarget}</td>}
                  <td className={`${tdClass} font-semibold`}>{formatUGX(item.amount)}</td>
                  <td className={tdClass}>{item.method}</td>
                  <td className={tdClass}><StatusPill value={item.status} /></td>
                  <td className={`${tdClass} font-mono text-xs`}>{item.transactionId}</td>
                  {donorView && (
                    <td className={tdClass}>
                      <button type="button" className="rounded-full px-2.5 py-1 text-xs font-semibold text-forest hover:bg-mist" onClick={() => { if (item.status !== 'Successful') setNote(`Receipt for ${item.transactionId} is available once the gift is confirmed.`); else window.location.assign(`/api/payments/receipt?reference=${encodeURIComponent(item.transactionId)}`) }}>Download Receipt</button>
                    </td>
                  )}
                  {donorView && (
                    <td className={tdClass}>
                      <div className="flex min-w-52 flex-col gap-2">
                        <Input aria-label={`Note for ${item.transactionId}`} value={drafts[item.id] ?? item.message ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} />
                        <div className="flex gap-2">
                          <button type="button" className="text-xs font-semibold text-forest" onClick={() => { const work = onUpdateMessage?.(item.id, drafts[item.id] ?? item.message ?? ''); void work?.then(() => setNote('Note saved.')) }}>Save note</button>
                          <button type="button" className="text-xs font-semibold text-ink" onClick={() => void onDelete?.(item.id).then(() => router.refresh())}>Remove</button>
                        </div>
                      </div>
                    </td>
                  )}
                  {!donorView && (onSetStatus || onDelete) && (
                    <td className={tdClass}>
                      <div className="flex min-w-44 flex-col gap-2">
                        {onSetStatus ? (
                          <Select aria-label={`Status for ${item.transactionId}`} value={item.status} onChange={(event) => void onSetStatus(item.id, event.target.value as DonationStatus).then(() => router.refresh()).catch((caught: unknown) => setNote(caught instanceof Error ? caught.message : 'The status could not be saved.'))}>
                            {giftStatuses.map((status) => <option key={status}>{status}</option>)}
                          </Select>
                        ) : null}
                        {onDelete ? <button type="button" className="text-left text-xs font-semibold text-ink" onClick={() => void onDelete(item.id).then(() => router.refresh()).catch((caught: unknown) => setNote(caught instanceof Error ? caught.message : 'The gift could not be removed.'))}>Remove</button> : null}
                      </div>
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
