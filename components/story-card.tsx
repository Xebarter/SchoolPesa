import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Story } from '@/lib/types'

export function StoryCard({ story, emphasis = false }: { story: Story; emphasis?: boolean }) {
  return (
    <article>
      <Link href={`/stories/${story.slug}`} className={cn('group relative block overflow-hidden bg-mist', emphasis ? 'aspect-[1.05]' : 'aspect-[1.25]')}>
        <Image src={story.image} alt="" fill className="motion-scale object-cover group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 50vw" />
      </Link>
      <div className="pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">{story.category}</p>
        <h3 className={cn('mt-3 font-semibold tracking-[-.03em] text-ink', emphasis ? 'max-w-[14ch] text-4xl leading-[1.05]' : 'text-2xl')}>
          <Link href={`/stories/${story.slug}`} className="transition-colors hover:text-brand">{story.title}</Link>
        </h3>
        <p className="mt-3 text-sm leading-6 text-sage">{story.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-sage">
          <time dateTime={story.date}>{formatDate(story.date)}</time>
          <Link href={`/stories/${story.slug}`} className="font-semibold text-forest transition-colors hover:text-brand">Read story</Link>
        </div>
      </div>
    </article>
  )
}
