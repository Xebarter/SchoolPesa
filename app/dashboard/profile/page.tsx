'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { saveDonorProfile } from '@/lib/actions'
import { deleteDonorProfile } from '@/lib/donor-actions'
import { updateAccount } from '@/lib/auth-client'
import { accountInitials, accountName } from '@/lib/supabase/account'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

export default function Page() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createBrowserClient()
    if (!supabase) return
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return
      setName(accountName(user.user_metadata, user.email))
      setEmail(user.email ?? '')
      setPhone(typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : '')
      setReady(true)
    })
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    try {
      await updateAccount({ name, phone })
      await saveDonorProfile({ name, email, phone })
      setSaved(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The profile could not be saved.')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <aside className="h-fit bg-mist p-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-forest text-lg font-semibold text-white">{accountInitials(name || 'Donor')}</span>
        <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">{name || 'Donor'}</h1>
        <p className="mt-1 text-sm text-sage">{email || 'Donor'}</p>
      </aside>
      <form className="bg-mist p-6" onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Profile</h2>
        <p className="mt-1 text-sm text-sage">These details appear on receipts and campaign updates.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Label className="sm:col-span-2">Name<Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required disabled={!ready} /></Label>
          <Label>Email<Input className="mt-2" type="email" value={email} readOnly /></Label>
          <Label>Phone<Input className="mt-2" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={!ready} /></Label>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button className="rounded-full bg-forest px-5 text-white hover:bg-brand-deep" disabled={!ready}>Save profile</Button>
          <Button type="button" variant="outline" className="rounded-full" disabled={!ready} onClick={() => { void deleteDonorProfile().then(() => setSaved(false)).catch((caught) => setError(caught instanceof Error ? caught.message : 'The profile record could not be removed.')) }}>Remove saved profile</Button>
          {saved ? <p role="status" className="text-sm text-forest">Profile saved.</p> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
      </form>
    </div>
  )
}
