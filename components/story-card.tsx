import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import type { Story } from '@/lib/types'

export function StoryCard({ story }: { story: Story }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <Link href={`/stories/${story.slug}`} className="relative block aspect-[1.35] bg-mist">
        <Image src={story.image} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
      </Link>
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">{story.category}</p>
        <h3 className="mt-3 text-2xl font-semibold text-ink">
          <Link href={`/stories/${story.slug}`}>{story.title}</Link>
        </h3>
        <p className="mt-3 text-sm leading-6 text-sage">{story.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-sage">
          <time dateTime={story.date}>{formatDate(story.date)}</time>
          <Link href={`/stories/${story.slug}`} className="font-semibold text-forest">Read story</Link>
        </div>
      </div>
    </article>
  )
}
