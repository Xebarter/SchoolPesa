import Image from 'next/image'
import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site/shell'
import { getNewsArticle, news } from '@/lib/data'
import { formatDate } from '@/lib/format'

export function generateStaticParams() {
  return news.map((article) => ({ slug: article.slug }))
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
      <article className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{article.category}</p>
        <h1 className="mt-3 text-4xl font-semibold">{article.title}</h1>
        <time className="mt-3 block text-sm text-sage" dateTime={article.date}>{formatDate(article.date)}</time>
        <div className="relative mt-6 aspect-[1.6] overflow-hidden rounded-[2rem]"><Image src={article.image} alt="" fill className="object-cover" /></div>
        <p className="mt-6 text-lg leading-8 text-sage">{article.body}</p>
      </article>
    </SiteShell>
  )
}
