import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'
import { SiteShell } from '@/components/site/shell'

export const metadata = { title: 'Sign in' }

export default function Page() {
  return (
    <SiteShell>
      <div className="grid min-h-[70vh] lg:grid-cols-2">
        <div className="flex flex-col justify-end bg-sky px-6 py-16 text-white lg:px-16 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-white/60">Your giving</p>
          <h1 className="mt-4 max-w-md text-5xl font-semibold tracking-[-.045em]">Welcome back</h1>
          <p className="mt-4 max-w-sm text-lg text-white/70">Sign in to see your impact.</p>
        </div>
        <div className="flex items-center bg-cream px-6 py-16 lg:px-16">
          <div className="w-full max-w-md"><Suspense><AuthForm mode="login" /></Suspense></div>
        </div>
      </div>
    </SiteShell>
  )
}
