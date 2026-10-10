import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
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
      <Band>
        <Flow width="lg" className="py-16 lg:py-24">
          <PageHeader eyebrow="Take part" title="Get involved" text="Give, sponsor, volunteer, partner or fundraise. Each path leads to a real education need." />
          <div className="mt-14">
            {options.map(([title, text, href], index) => (
              <Link key={title} href={href} className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 py-6">
                <span className="text-sm font-semibold text-brand">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <h2 className="text-4xl font-semibold tracking-[-.04em] transition-colors group-hover:text-brand">{title}</h2>
                  <p className="mt-1 text-sage">{text}</p>
                </span>
                <ArrowRight className="size-5 text-forest transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </Flow>
      </Band>
    </SiteShell>
  )
}
