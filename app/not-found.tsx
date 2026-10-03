import Link from 'next/link'
import { SiteShell } from '@/components/site/shell'

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-4xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sage">That link does not match a School Pesa page.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-forest">Back home</Link>
      </div>
    </SiteShell>
  )
}
