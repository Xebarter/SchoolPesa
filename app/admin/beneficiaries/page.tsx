import { BeneficiaryManager } from '@/components/admin/beneficiary-manager'
import { beneficiaries } from '@/lib/data'

export const metadata = { title: 'Admin beneficiaries' }

export default function Page() {
  return <BeneficiaryManager initial={beneficiaries} />
}
