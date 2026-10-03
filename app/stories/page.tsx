import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { StoryCard } from '@/components/story-card'
import { EmptyState } from '@/components/states'
import { stories } from '@/lib/data'

const filters = ['All', 'Success Stories', 'Scholarships', 'School Requirements', 'Community', 'Students', 'Events']

export const metadata = { title: 'Stories' }

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const list = stories.filter((story) => story.status === 'published' && (!category || category === 'All' || story.category === category))
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <PageHeader eyebrow="Stories of impact" title="Small steps. Big futures." text="Read how fees, books and uniforms become time in school." />
        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((item) => (
            <Link key={item} href={item === 'All' ? '/stories' : `/stories?category=${encodeURIComponent(item)}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${(!category && item === 'All') || category === item ? 'bg-forest text-white' : 'border border-line bg-white text-sage'}`}>{item}</Link>
          ))}
        </div>
        {list.length === 0 ? <div className="mt-8"><EmptyState title="No stories in this category" body="Try another filter." /></div> : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{list.map((story) => <StoryCard key={story.id} story={story} />)}</div>
        )}
      </div>
    </SiteShell>
  )
}
