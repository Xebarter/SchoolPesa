import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'

const options = [
  ['Donate', 'Support education directly.', '/donate'],
  ['Sponsor a child', 'Support a child’s education.', '/sponsor'],
  ['Volunteer', 'Give your time and skills.', '/volunteer'],
  ['Partner', 'Work with School Pesa.', '/contact'],
  ['Fundraise', 'Create or support fundraising campaigns.', '/campaigns'],
]

export const metadata = { title: 'Get involved' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
        <PageHeader eyebrow="Take part" title="Get involved" text="Give, sponsor, volunteer, partner or fundraise. Each path leads to a real education need." />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {options.map(([title, text, href]) => (
            <Link key={title} href={href} className="rounded-2xl border border-line bg-white p-6 hover:border-forest">
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sage">{text}</p>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  )
}
