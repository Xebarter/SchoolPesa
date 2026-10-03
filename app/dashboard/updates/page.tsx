import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PageIntro } from '@/components/admin/ui'
import { stories } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Impact updates' }

export default function Page() {
  const published = stories.filter((story) => story.status === 'published')
  return (
    <div>
      <PageIntro title="Impact updates" description="Stories from the classrooms and campaigns your gifts support." />
      <ul className="mt-6 grid gap-4">
        {published.map((story) => (
          <li key={story.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-forest/5">
            <div className="grid sm:grid-cols-[12rem_1fr]">
              <div className="relative min-h-36 bg-mist">
                <Image src={story.image} alt="" fill className="object-cover" sizes="192px" />
              </div>
              <div className="flex flex-col justify-center p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{story.category}</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                  <Link href={`/stories/${story.slug}`} className="hover:text-forest">{story.title}</Link>
                </h2>
                <p className="mt-2 text-sm leading-6 text-sage">{story.excerpt}</p>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                  <time dateTime={story.date} className="text-sage">{formatDate(story.date)}</time>
                  <Link href={`/stories/${story.slug}`} className="inline-flex items-center gap-1 font-semibold text-forest">
                    Read story <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
