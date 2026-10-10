import { PageHeader } from '@/components/page-header'
import { SocialLinks } from '@/components/social-icons'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { ContactForm } from '@/components/simple-forms'

export const metadata = { title: 'Contact' }

export default function Page() {
  return (
    <SiteShell>
      <div className="grid lg:grid-cols-2">
        <Band tone="forest">
          <Flow width="lg" className="py-16 lg:py-28">
            <PageHeader eyebrow="Talk to us" title="Contact" text="Questions about a gift, a partnership or a learner profile." tone="light" />
            <dl className="mt-10 space-y-4 text-sm">
              <div><dt className="text-white/60">Email</dt><dd><a className="font-semibold" href="mailto:hello@schoolpesa.example">hello@schoolpesa.example</a></dd></div>
              <div><dt className="text-white/60">Phone</dt><dd className="font-semibold">+256 700 000 100</dd></div>
              <div><dt className="text-white/60">Location</dt><dd className="font-semibold">Kampala, Uganda</dd></div>
            </dl>
            <div className="mt-8"><SocialLinks light /></div>
          </Flow>
        </Band>
        <Band tone="mist">
          <Flow width="lg" className="py-16 lg:py-28">
            <ContactForm />
          </Flow>
        </Band>
      </div>
    </SiteShell>
  )
}
