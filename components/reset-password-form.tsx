'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { updatePassword } from '@/lib/auth-client'

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setError('')
    setPending(true)
    try {
      await updatePassword(password)
      router.push('/dashboard')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The password could not be updated.')
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <Label>New password<Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" /></Label>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <Button className="h-12 rounded-full bg-forest" disabled={pending}>Save password</Button>
    </form>
  )
}
