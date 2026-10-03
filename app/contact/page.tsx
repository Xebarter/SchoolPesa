import { PageHeader } from '@/components/page-header'
import { SocialLinks } from '@/components/social-icons'
import { SiteShell } from '@/components/site/shell'
import { ContactForm } from '@/components/simple-forms'

export const metadata = { title: 'Contact' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 lg:grid-cols-2 lg:px-8">
        <div>
          <PageHeader eyebrow="Talk to us" title="Contact" text="Questions about a gift, a partnership or a learner profile." />
          <dl className="mt-8 space-y-3 text-sm">
            <div><dt className="text-sage">Email</dt><dd><a className="font-semibold" href="mailto:hello@schoolpesa.example">hello@schoolpesa.example</a></dd></div>
            <div><dt className="text-sage">Phone</dt><dd className="font-semibold">+256 700 000 100</dd></div>
            <div><dt className="text-sage">Location</dt><dd className="font-semibold">Kampala, Uganda</dd></div>
          </dl>
          <div className="mt-6"><SocialLinks /></div>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6"><ContactForm /></div>
      </div>
    </SiteShell>
  )
}
