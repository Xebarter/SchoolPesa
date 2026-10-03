import { AuthForm } from '@/components/auth-form'
import { SiteShell } from '@/components/site/shell'

export const metadata = { title: 'Forgot password' }

export default function Page() {
  return (
    <SiteShell>
      <div className="grid min-h-[70vh] place-items-center px-5 py-16">
        <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8">
          <h1 className="text-3xl font-semibold">Reset your password</h1>
          <p className="mt-2 text-sm text-sage">We will email a reset link when Supabase Auth is connected.</p>
          <AuthForm mode="reset" />
        </div>
      </div>
    </SiteShell>
  )
}
