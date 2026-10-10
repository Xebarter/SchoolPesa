import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/dashboard'
  return value
}

function withCookies(redirect: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie)
  })
  return redirect
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  const user = data.user
  const path = request.nextUrl.pathname

  if (path.startsWith('/dashboard') && !user) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/login'
    redirect.search = ''
    redirect.searchParams.set('next', path)
    return withCookies(NextResponse.redirect(redirect), response)
  }

  if ((path === '/login' || path === '/register') && user) {
    return withCookies(NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get('next')), request.url)), response)
  }

  if (path === '/reset-password' && !user) {
    return withCookies(NextResponse.redirect(new URL('/forgot-password', request.url)), response)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
