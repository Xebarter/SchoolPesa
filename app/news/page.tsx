import Image from 'next/image'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { getNews } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'News' }

export default function Page() {
  const news = getNews()
  return (
    <SiteShell>
      <Band>
        <Flow className="py-16 lg:py-24">
          <PageHeader layout="split" eyebrow="Updates" title="News" text="Campaign openings, impact notes and community events." />
          <div className="mt-14 grid items-start gap-x-12 gap-y-14 lg:grid-cols-[1.35fr_.8fr]">
            {news[0] ? (
              <article>
                <Link href={`/news/${news[0].slug}`} className="group relative block aspect-[1.05] overflow-hidden bg-mist">
                  <Image src={news[0].image} alt="" fill className="motion-scale object-cover group-hover:scale-[1.03]" sizes="50vw" />
                </Link>
                <div className="pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand">{news[0].category}</p>
                  <h2 className="mt-2 max-w-[14ch] text-4xl font-semibold leading-[1.05] tracking-[-.03em]"><Link href={`/news/${news[0].slug}`} className="transition-colors hover:text-brand">{news[0].title}</Link></h2>
                  <p className="mt-3 max-w-md text-base leading-7 text-sage">{news[0].excerpt}</p>
                  <time className="mt-3 block text-xs text-sage" dateTime={news[0].date}>{formatDate(news[0].date)}</time>
                </div>
              </article>
            ) : null}
            <div className="grid gap-10">
              {news.slice(1).map((article) => (
                <article key={article.id}>
                  <Link href={`/news/${article.slug}`} className="group relative block aspect-[1.4] overflow-hidden bg-mist">
                    <Image src={article.image} alt="" fill className="motion-scale object-cover group-hover:scale-[1.03]" sizes="30vw" />
                  </Link>
                  <div className="pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand">{article.category}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]"><Link href={`/news/${article.slug}`} className="transition-colors hover:text-brand">{article.title}</Link></h2>
                    <p className="mt-2 text-sm leading-6 text-sage">{article.excerpt}</p>
                    <time className="mt-3 block text-xs text-sage" dateTime={article.date}>{formatDate(article.date)}</time>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Flow>
      </Band>
    </SiteShell>
  )
}
