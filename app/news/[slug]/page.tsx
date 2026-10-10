import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Band, Bridge, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { getNews, getNewsArticle } from '@/lib/data'
import { formatDate } from '@/lib/format'

export function generateStaticParams() {
  return getNews().map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const article = getNewsArticle((await params).slug)
  return { title: article?.title ?? 'News', description: article?.excerpt }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const article = getNewsArticle((await params).slug)
  if (!article) notFound()
  return (
    <SiteShell>
      <article>
        <Band>
          <Flow width="md" className="pb-20 pt-16 lg:pb-28 lg:pt-24">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{article.category}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-6xl">{article.title}</h1>
            <time className="mt-4 block text-sm text-sage" dateTime={article.date}>{formatDate(article.date)}</time>
          </Flow>
        </Band>
        <div className="relative h-[24rem] bg-mist sm:h-[32rem]">
          <Image src={article.image} alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
        <Bridge>
          <Band>
            <Flow width="md" className="pb-20 pt-6 lg:pb-28">
              <p className="text-lg leading-8 text-sage">{article.body}</p>
            </Flow>
          </Band>
        </Bridge>
      </article>
    </SiteShell>
  )
}
