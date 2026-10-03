import Link from 'next/link'
import { stories } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Impact updates' }

export default function Page() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">Impact updates</h1>
      <ul className="mt-6 space-y-3">
        {stories.map((story) => (
          <li key={story.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs text-sage">{formatDate(story.date)} · {story.category}</p>
            <Link href={`/stories/${story.slug}`} className="font-semibold">{story.title}</Link>
            <p className="text-sm text-sage">{story.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
