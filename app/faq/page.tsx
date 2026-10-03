import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { faqs } from '@/lib/data'

export const metadata = { title: 'FAQs' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <PageHeader eyebrow="Answers" title="Frequently asked questions" text="Donations, funds, sponsorship, campaigns, payments, receipts, privacy and volunteering." />
        <div className="mt-8 flex flex-col gap-3">
          {faqs.map((faq) => (
            <details key={faq.id} className="rounded-2xl border border-line bg-white p-5">
              <summary className="cursor-pointer font-semibold">{faq.question}</summary>
              <p className="mt-3 text-sm leading-6 text-sage">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </SiteShell>
  )
}
