import Link from 'next/link'
import { campaigns } from '@/lib/data'
import { formatUGX } from '@/lib/format'

export const metadata = { title: 'My campaigns' }

export default function Page() {
  const supported = campaigns.filter((item) => ['camp-1', 'camp-2', 'camp-3'].includes(item.id))
  return (
    <div>
      <h1 className="text-3xl font-semibold">My campaigns</h1>
      <ul className="mt-6 grid gap-3">
        {supported.map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
            <Link href={`/campaigns/${item.slug}`} className="font-semibold">{item.title}</Link>
            <p className="text-sm text-sage">{formatUGX(item.raised)} raised · {item.status}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
