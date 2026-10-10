'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { sendReset, signInWithGoogle, signInWithPassword, signUp } from '@/lib/auth-client'

function nextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

export function AuthForm({ mode }: { mode: 'login' | 'register' | 'reset' }) {
  const router = useRouter()
  const params = useSearchParams()
  const next = nextPath(params.get('next'))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(params.get('error') === 'auth' ? 'That sign-in link expired or could not be confirmed. Try again.' : '')
  const [done, setDone] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setError('')
    setDone('')
    setPending(true)
    try {
      if (mode === 'login') {
        await signInWithPassword(email, password)
        router.push(next)
        router.refresh()
      } else if (mode === 'register') {
        const result = await signUp(name, email, password)
        if (result.confirmed) {
          router.push(next)
          router.refresh()
        } else {
          setDone('Check your email and confirm the account. Then you can sign in.')
        }
      } else {
        await sendReset(email)
        setDone('If an account exists for that email, a reset link is on its way.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      {mode === 'register' && <Label>Name<Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></Label>}
      <Label>Email<Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" autoComplete="email" /></Label>
      {mode !== 'reset' && <Label>Password<Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></Label>}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {done && <p className="text-sm text-forest" role="status">{done}</p>}
      <Button className="h-12 rounded-full bg-forest" disabled={pending}>{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}</Button>
      {mode !== 'reset' && (
        <Button type="button" variant="outline" className="h-12 rounded-full" disabled={pending} onClick={() => {
          setError('')
          setPending(true)
          signInWithGoogle(next).catch((caught) => {
            setPending(false)
            setError(caught instanceof Error ? caught.message : 'Google sign-in is unavailable.')
          })
        }}>
          Continue with Google
        </Button>
      )}
      <p className="text-center text-sm text-sage">
        {mode === 'login' && <>New here? <Link href="/register" className="font-semibold text-brand">Create an account</Link> · <Link href="/forgot-password" className="font-semibold text-forest">Forgot password</Link></>}
        {mode === 'register' && <Link href="/login" className="font-semibold text-brand">Already have an account? Sign in</Link>}
        {mode === 'reset' && <Link href="/login" className="font-semibold text-brand">Back to sign in</Link>}
      </p>
    </form>
  )
}
