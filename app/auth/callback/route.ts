import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/dashboard'
  return value
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next'))
  if (code) {
    const supabase = await createServerClient()
    const { error } = supabase ? await supabase.auth.exchangeCodeForSession(code) : { error: new Error('Sign-in is not configured yet.') }
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/login?error=auth', url.origin))
}
