import { BeneficiaryManager } from '@/components/admin/beneficiary-manager'
import { getAllBeneficiaries } from '@/lib/data'

export const metadata = { title: 'Admin beneficiaries' }

export default async function Page() {
  return <BeneficiaryManager initial={await getAllBeneficiaries()} />
}
