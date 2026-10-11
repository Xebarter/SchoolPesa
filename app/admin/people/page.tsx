import { PeopleBoard } from '@/components/admin/people-board'
import { getDonations, getPartners, getVolunteers } from '@/lib/data'

export const metadata = { title: 'Admin people' }

export default async function Page() {
  const [donations, partners, volunteers] = await Promise.all([getDonations(), getPartners(), getVolunteers()])
  const donors = donations.filter((item) => !item.anonymous)
  return <PeopleBoard donors={donors} partners={partners} volunteers={volunteers} />
}
