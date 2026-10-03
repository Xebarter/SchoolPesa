import Image from 'next/image'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { news } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'News' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <PageHeader eyebrow="Updates" title="News" text="Campaign openings, impact notes and community events." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {news.map((article) => (
            <article key={article.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              <Link href={`/news/${article.slug}`} className="relative block aspect-[1.4] bg-mist"><Image src={article.image} alt="" fill className="object-cover" /></Link>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">{article.category}</p>
                <h2 className="mt-2 text-xl font-semibold"><Link href={`/news/${article.slug}`}>{article.title}</Link></h2>
                <p className="mt-2 text-sm text-sage">{article.excerpt}</p>
                <time className="mt-3 block text-xs text-sage" dateTime={article.date}>{formatDate(article.date)}</time>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SiteShell>
  )
}
