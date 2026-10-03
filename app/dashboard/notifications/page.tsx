import { Bell } from 'lucide-react'
import { PageIntro } from '@/components/admin/ui'
import { notifications } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Notifications' }

export default function Page() {
  const unread = notifications.filter((item) => !item.read).length
  return (
    <div>
      <PageIntro title="Notifications" description={unread ? `${unread} unread update${unread === 1 ? '' : 's'} from campaigns you support.` : 'You are caught up.'} />
      <ul className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-forest/5">
        {notifications.map((item) => (
          <li key={item.id} className="flex gap-4 border-b border-line px-5 py-4 last:border-0">
            <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${item.read ? 'bg-mist text-sage' : 'bg-forest text-white'}`}>
              <Bell className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {!item.read ? <span className="rounded-full bg-[#fff4dc] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a5a12]">New</span> : null}
              </div>
              <p className="mt-1 text-sm leading-6 text-sage">{item.body}</p>
              <p className="mt-2 text-xs text-sage">{formatDate(item.date)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
