'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { sendReset, signInWithGoogle, signInWithPassword, signUp } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'login' | 'register' | 'reset' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      if (mode === 'login') {
        await signInWithPassword(email, password)
        router.push('/dashboard')
      } else if (mode === 'register') {
        await signUp(name, email, password)
        router.push('/dashboard')
      } else {
        await sendReset(email)
        setDone('If an account exists, a reset link is on its way. In demo mode you can sign in from the login screen.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      {mode === 'register' && <Label>Name<Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required /></Label>}
      <Label>Email<Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></Label>
      {mode !== 'reset' && <Label>Password<Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></Label>}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {done && <p className="text-sm text-forest" role="status">{done}</p>}
      <Button className="h-12 rounded-full bg-forest">{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}</Button>
      {mode !== 'reset' && (
        <Button type="button" variant="outline" className="h-12 rounded-full" onClick={() => signInWithGoogle().catch((caught) => setError(caught instanceof Error ? caught.message : 'Google sign-in is unavailable.'))}>
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
