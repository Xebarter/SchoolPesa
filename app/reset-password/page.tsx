import { ResetPasswordForm } from '@/components/reset-password-form'
import { SiteShell } from '@/components/site/shell'

export const metadata = { title: 'Choose a new password' }

export default function Page() {
  return (
    <SiteShell>
      <div className="grid min-h-[70vh] lg:grid-cols-2">
        <div className="flex flex-col justify-end bg-sky px-6 py-16 text-white lg:px-16 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-white/60">Account help</p>
          <h1 className="mt-4 max-w-md text-5xl font-semibold tracking-[-.045em]">Choose a new password</h1>
          <p className="mt-4 max-w-sm text-lg text-white/70">Use at least 6 characters. You will go straight to your dashboard.</p>
        </div>
        <div className="flex items-center bg-cream px-6 py-16 lg:px-16">
          <div className="w-full max-w-md"><ResetPasswordForm /></div>
        </div>
      </div>
    </SiteShell>
  )
}
