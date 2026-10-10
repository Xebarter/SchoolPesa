import { UserBoard } from '@/components/admin/user-board'
import { getUsers } from '@/lib/data'

export const metadata = { title: 'Admin users' }

export default function Page() {
  return <UserBoard users={getUsers()} />
}
