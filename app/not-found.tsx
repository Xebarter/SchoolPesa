import Link from 'next/link'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'

export default function NotFound() {
  return (
    <SiteShell>
      <Band>
        <Flow width="lg" className="py-24 lg:py-32">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">404</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-[-.05em] sm:text-6xl">Page not found</h1>
          <p className="mt-5 max-w-md text-lg text-sage">That link does not match a School Pesa page.</p>
          <Link href="/" className="mt-8 inline-flex rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep">Back home</Link>
        </Flow>
      </Band>
    </SiteShell>
  )
}
