import { PageIntro, Panel } from '@/components/admin/ui'
import { events, faqs, news } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Admin content' }

const pages = [
  ['Home', '/'],
  ['About', '/about'],
  ['Get involved', '/get-involved'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
]

export default function Page() {
  return (
    <div>
      <PageIntro title="Content" description="Public pages, news, events and questions that appear on the site." />
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Pages" description="Fixed routes in the public site.">
          <ul className="divide-y divide-line">
            {pages.map(([title, href]) => (
              <li key={href} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span className="text-sm font-semibold text-ink">{title}</span>
                <span className="font-mono text-xs text-sage">{href}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="News" description={`${news.length} articles`}>
          <ul className="divide-y divide-line">
            {news.map((item) => (
              <li key={item.id} className="px-5 py-3.5">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-sage">{item.category} · {formatDate(item.date)}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Events" description={`${events.length} upcoming and past`}>
          <ul className="divide-y divide-line">
            {events.map((item) => (
              <li key={item.id} className="px-5 py-3.5">
                <p className="text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-xs text-sage">{formatDate(item.date)} · {item.location}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="FAQs" description={`${faqs.length} answers grouped by topic`}>
          <ul className="divide-y divide-line">
            {faqs.map((item) => (
              <li key={item.id} className="px-5 py-3.5">
                <p className="text-sm font-semibold text-ink">{item.question}</p>
                <p className="mt-1 text-xs text-sage">{item.topic}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
