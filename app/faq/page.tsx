import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { getFaqs } from '@/lib/data'

export const metadata = { title: 'FAQs' }

export default function Page() {
  const faqs = getFaqs()
  return (
    <SiteShell>
      <Band>
        <Flow width="md" className="py-16 lg:py-24">
          <PageHeader eyebrow="Answers" title="Frequently asked questions" text="Donations, funds, sponsorship, campaigns, payments, receipts, privacy and volunteering." />
          <div className="mt-14 flex flex-col gap-10">
            {faqs.map((faq) => (
              <details key={faq.id} className="group">
                <summary className="cursor-pointer text-xl font-semibold tracking-[-.02em] transition-colors hover:text-brand">{faq.question}</summary>
                <p className="mt-3 max-w-2xl text-base leading-7 text-sage">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Flow>
      </Band>
    </SiteShell>
  )
}
