import { AuthForm } from '@/components/auth-form'
import { SiteShell } from '@/components/site/shell'

export const metadata = { title: 'Sign in' }

export default function Page() {
  return (
    <SiteShell>
      <div className="grid min-h-[70vh] place-items-center px-5 py-16">
        <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8">
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-sage">Sign in to see your impact.</p>
          <AuthForm mode="login" />
        </div>
      </div>
    </SiteShell>
  )
}
