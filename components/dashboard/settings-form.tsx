'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'
import { clearEmailUpdates, saveEmailUpdates } from '@/lib/donor-actions'
import { cn } from '@/lib/utils'

export function SettingsForm({ emailUpdates }: { emailUpdates: boolean }) {
  const router = useRouter()
  const [emailOn, setEmailOn] = useState(emailUpdates)
  const [error, setError] = useState('')

  async function toggle() {
    const next = !emailOn
    setEmailOn(next)
    setError('')
    try {
      await saveEmailUpdates(next)
      router.refresh()
    } catch (caught) {
      setEmailOn(!next)
      setError(caught instanceof Error ? caught.message : 'The setting could not be saved.')
    }
  }

  return (
    <div className="grid max-w-2xl gap-4">
      <section className="bg-mist p-6">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Notifications</h1>
        <p className="mt-1 text-sm leading-6 text-sage">Choose how School Pesa reaches you when a campaign you support posts an update.</p>
        <div className="mt-5 flex items-center justify-between gap-4 bg-cream px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Email updates</p>
            <p className="mt-0.5 text-xs text-sage">{emailOn ? 'You will be emailed when a campaign you support posts an update.' : 'Email updates are off.'}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailOn}
            aria-label="Email me when a campaign I support posts an update"
            onClick={() => void toggle()}
            className={cn('relative h-6 w-11 shrink-0 rounded-full transition', emailOn ? 'bg-forest' : 'bg-line')}
          >
            <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition', emailOn ? 'left-5' : 'left-0.5')} />
          </button>
        </div>
        <button type="button" className="mt-4 text-xs font-semibold text-ink" onClick={() => void clearEmailUpdates().then(() => { setEmailOn(true); router.refresh() })}>Reset this preference</button>
        {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
      </section>
      <section className="bg-mist p-6">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Account</h2>
        <p className="mt-1 text-sm leading-6 text-sage">Sign out of this browser. Your gifts and receipts stay on your account.</p>
        <Button className="mt-5 rounded-full" variant="outline" onClick={() => { void signOut().then(() => { router.push('/'); router.refresh() }) }}>Sign out</Button>
      </section>
    </div>
  )
}
