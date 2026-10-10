import { BeneficiaryManager } from '@/components/admin/beneficiary-manager'
import { getBeneficiaries } from '@/lib/data'

export const metadata = { title: 'Admin beneficiaries' }

export default function Page() {
  return <BeneficiaryManager initial={getBeneficiaries()} />
}
