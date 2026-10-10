'use client'

import { createBrowserClient } from '@/lib/supabase/client'

function client() {
  const supabase = createBrowserClient()
  if (!supabase) throw new Error('Sign-in is not configured yet.')
  return supabase
}

export function authRedirect(next = '/dashboard') {
  const path = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await client().auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(name: string, email: string, password: string) {
  const { data, error } = await client().auth.signUp({
    email,
    password,
    options: {
      data: { name, full_name: name },
      emailRedirectTo: authRedirect('/dashboard'),
    },
  })
  if (error) throw error
  return { confirmed: Boolean(data.session) }
}

export async function sendReset(email: string) {
  const { error } = await client().auth.resetPasswordForEmail(email, {
    redirectTo: authRedirect('/reset-password'),
  })
  if (error) throw error
}

export async function signInWithGoogle(next = '/dashboard') {
  const { error } = await client().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authRedirect(next) },
  })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await client().auth.updateUser({ password })
  if (error) throw error
}

export async function updateAccount(input: { name: string; phone: string }) {
  const { error } = await client().auth.updateUser({
    data: { name: input.name, full_name: input.name, phone: input.phone },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await client().auth.signOut()
  if (error) throw error
}

export async function signOutEverywhere() {
  const { error } = await client().auth.signOut({ scope: 'global' })
  if (error) throw error
}
