import { AuditList } from '@/components/admin/audit-list'
import { getAuditLogs } from '@/lib/data'

export const metadata = { title: 'Audit logs' }

export default function Page() {
  return <AuditList logs={getAuditLogs()} />
}
