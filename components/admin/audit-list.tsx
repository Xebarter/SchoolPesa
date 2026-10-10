'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageIntro, Panel, StatusPill } from '@/components/admin/ui'
import { deleteAuditLog } from '@/lib/admin-actions'
import { formatDate } from '@/lib/format'
import type { AuditLog } from '@/lib/types'

export function AuditList({ logs }: { logs: AuditLog[] }) {
  const router = useRouter()
  const [error, setError] = useState('')

  return (
    <div>
      <PageIntro title="Audit log" description="Each change to campaigns, finance, content and settings is recorded here." />
      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
      <Panel className="mt-6" title="Activity" description={`${logs.length} recorded events`}>
        <ol className="divide-y divide-line">
          {logs.map((item) => (
            <li key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-ink">{formatDate(item.date)}</p>
                <p className="text-xs text-sage">{item.time}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{item.details}</p>
                <p className="mt-1 text-xs text-sage">{item.user} · {item.resource}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill value={item.action} />
                <button type="button" className="text-xs font-semibold text-ink" onClick={() => void deleteAuditLog(item.id).then(() => router.refresh()).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'The entry could not be removed.'))}>Remove</button>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}
