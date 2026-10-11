import { AuditList } from '@/components/admin/audit-list'
import { getAuditLogs } from '@/lib/data'

export const metadata = { title: 'Audit logs' }

export default async function Page() {
  return <AuditList logs={await getAuditLogs()} />
}
