'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { clearDemoUser } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

export default function Page() {
  const router = useRouter()
  const [emailOn, setEmailOn] = useState(true)
  return (
    <div className="grid max-w-2xl gap-4">
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm shadow-forest/5">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Notifications</h1>
        <p className="mt-1 text-sm leading-6 text-sage">Choose how School Pesa reaches you when a campaign you support posts an update.</p>
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-[#f7faf8] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Email updates</p>
            <p className="mt-0.5 text-xs text-sage">{emailOn ? 'You will be emailed when notifications are connected.' : 'Email updates are off for this session.'}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailOn}
            aria-label="Email me when a campaign I support posts an update"
            onClick={() => setEmailOn((value) => !value)}
            className={cn('relative h-6 w-11 shrink-0 rounded-full transition', emailOn ? 'bg-forest' : 'bg-line')}
          >
            <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition', emailOn ? 'left-5' : 'left-0.5')} />
          </button>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm shadow-forest/5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Account</h2>
        <p className="mt-1 text-sm leading-6 text-sage">Sign out of this browser. Your gifts and receipts stay on your account.</p>
        <Button className="mt-5 rounded-full" variant="outline" onClick={() => { clearDemoUser(); router.push('/') }}>Sign out</Button>
      </section>
    </div>
  )
}
