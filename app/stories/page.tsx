import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { chipClass, Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { StoryCard } from '@/components/story-card'
import { EmptyState } from '@/components/states'
import { getStories } from '@/lib/data'

const filters = ['All', 'Success Stories', 'Scholarships', 'School Requirements', 'Community', 'Students', 'Events']

export const metadata = { title: 'Stories' }

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const stories = getStories()
  const list = stories.filter((story) => story.status === 'published' && (!category || category === 'All' || story.category === category))
  return (
    <SiteShell>
      <Band>
        <Flow className="py-16 lg:py-24">
          <PageHeader layout="split" eyebrow="Stories of impact" title="Small steps. Big futures." text="Read how fees, books and uniforms become time in school." />
          <div className="mt-10 flex flex-wrap gap-2">
            {filters.map((item) => (
              <Link key={item} href={item === 'All' ? '/stories' : `/stories?category=${encodeURIComponent(item)}`} className={chipClass((!category && item === 'All') || category === item)}>{item}</Link>
            ))}
          </div>
          {list.length === 0 ? <div className="mt-10"><EmptyState title="No stories in this category" body="Try another filter." /></div> : (
            <div className="mt-14 grid items-start gap-x-12 gap-y-14 lg:grid-cols-[1.35fr_.8fr]">
              <StoryCard story={list[0]} emphasis />
              <div className="grid gap-10">
                {list.slice(1).map((story) => <StoryCard key={story.id} story={story} />)}
              </div>
            </div>
          )}
        </Flow>
      </Band>
    </SiteShell>
  )
}
