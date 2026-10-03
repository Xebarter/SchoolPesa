import { notifications } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Notifications' }

export default function Page() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">Notifications</h1>
      <ul className="mt-6 space-y-3">
        {notifications.map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs text-sage">{formatDate(item.date)} · {item.read ? 'Read' : 'New'}</p>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-sage">{item.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
