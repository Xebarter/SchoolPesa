import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { partners, users } from '@/lib/data'

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
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
        <PageHeader eyebrow="About School Pesa" title="Supporting education. Changing futures." text="A modern platform for education support, built to stay clear about where money goes." />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {sections.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-sage">{text}</p>
            </article>
          ))}
        </div>
        <h2 className="mt-12 text-2xl font-semibold">Leadership</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {users.slice(0, 3).map((user) => (
            <li key={user.id} className="rounded-2xl border border-line bg-white p-4">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-sage">{user.role}</p>
            </li>
          ))}
        </ul>
        <h2 className="mt-12 text-2xl font-semibold">Partners</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {partners.map((partner) => <li key={partner.id} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold">{partner.name}</li>)}
        </ul>
      </div>
    </SiteShell>
  )
}
