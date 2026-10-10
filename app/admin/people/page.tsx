import { PeopleBoard } from '@/components/admin/people-board'
import { getDonations, getPartners, getVolunteers } from '@/lib/data'

export const metadata = { title: 'Admin people' }

export default function Page() {
  const donors = getDonations().filter((item) => !item.anonymous)
  return <PeopleBoard donors={donors} partners={getPartners()} volunteers={getVolunteers()} />
}
