import Link from 'next/link'
import { beneficiaries } from '@/lib/data'

export const metadata = { title: 'Sponsored children' }

export default function Page() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">Sponsored children</h1>
      <ul className="mt-6 grid gap-3">
        {beneficiaries.map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
            <Link href={`/sponsor/${item.id}`} className="font-semibold">{item.displayName}</Link>
            <p className="text-sm text-sage">{item.level} · {item.location} · {item.needs}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
