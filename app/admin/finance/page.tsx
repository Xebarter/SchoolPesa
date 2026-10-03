import { FinancePanel } from '@/components/admin/finance-panel'
import { expenses } from '@/lib/data'

export const metadata = { title: 'Admin finance' }

export default function Page() {
  return <FinancePanel initial={expenses} />
}
