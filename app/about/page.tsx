import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { getPartners, getUsers } from '@/lib/data'

const sections = [
  ['Who we are', 'School Pesa is an education fundraising platform. It connects people who want to help with children and students who need support from nursery through university.'],
  ['Mission', 'Keep children and students in school by funding practical education needs and showing donors what those gifts make possible.'],
  ['Vision', 'A future where the cost of fees, books, uniforms or meals never decides whether a child can learn.'],
  ['Values', 'Hope, trust, transparency and dignity. Learner stories are published only with privacy controls in place.'],
  ['What we do', 'We run campaigns, sponsorship profiles, impact stories and a clear path from donation to allocation to update.'],
  ['Who we support', 'Learners from nursery, primary, secondary and university, plus the schools and programs around them.'],
  ['How funds are used', 'A gift is tied to a campaign or a learner need, then to an allocation, an expense and an impact update.'],
  ['Accountability', 'Administrators record donations, expenses and audit activity. Donors can read stories, statistics and campaign updates.'],
]

export const metadata = { title: 'About' }

export default function Page() {
  const partners = getPartners()
  const users = getUsers()
  return (
    <SiteShell>
      <Band>
        <Flow width="lg" className="py-16 lg:py-24">
          <PageHeader layout="split" eyebrow="About School Pesa" title="Supporting education. Changing futures." text="A modern platform for education support, built to stay clear about where money goes." />
          <div className="mt-16 grid gap-x-16 gap-y-12 md:grid-cols-2">
            {sections.map(([title, text]) => (
              <article key={title}>
                <h2 className="text-2xl font-semibold tracking-[-.03em]">{title}</h2>
                <p className="mt-3 text-base leading-7 text-sage">{text}</p>
              </article>
            ))}
          </div>
        </Flow>
      </Band>
      <Band tone="mist">
        <Flow width="lg" className="py-16 lg:py-24">
          <h2 className="text-3xl font-semibold tracking-[-.03em]">Leadership</h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3">
            {users.slice(0, 3).map((user) => (
              <li key={user.id}>
                <p className="text-xl font-semibold">{user.name}</p>
                <p className="mt-1 text-sm text-sage">{user.role}</p>
              </li>
            ))}
          </ul>
          <h2 className="mt-16 text-3xl font-semibold tracking-[-.03em]">Partners</h2>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {partners.map((partner) => <li key={partner.id} className="text-lg font-semibold text-forest">{partner.name}</li>)}
          </ul>
        </Flow>
      </Band>
    </SiteShell>
  )
}
