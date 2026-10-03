'use client'

import { createBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

const storageKey = 'schoolpesa-demo-user'

export type DemoUser = { name: string; email: string }

export function readDemoUser(): DemoUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DemoUser
  } catch {
    return null
  }
}

export function saveDemoUser(user: DemoUser) {
  window.localStorage.setItem(storageKey, JSON.stringify(user))
}

export function clearDemoUser() {
  window.localStorage.removeItem(storageKey)
}

export async function signInWithPassword(email: string, password: string, name = 'Sarah') {
  const client = createBrowserClient()
  if (client && isSupabaseConfigured()) {
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    return
  }
  if (!email || !password) throw new Error('Enter your email and password.')
  saveDemoUser({ name, email })
}

export async function signUp(name: string, email: string, password: string) {
  const client = createBrowserClient()
  if (client && isSupabaseConfigured()) {
    const { error } = await client.auth.signUp({ email, password, options: { data: { name } } })
    if (error) throw error
    return
  }
  saveDemoUser({ name, email })
}

export async function sendReset(email: string) {
  const client = createBrowserClient()
  if (client && isSupabaseConfigured()) {
    const { error } = await client.auth.resetPasswordForEmail(email)
    if (error) throw error
  }
}

export async function signInWithGoogle() {
  const client = createBrowserClient()
  if (client && isSupabaseConfigured()) {
    const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (error) throw error
    return
  }
  saveDemoUser({ name: 'Sarah', email: 'sarah@example.com' })
  window.location.href = '/dashboard'
}
