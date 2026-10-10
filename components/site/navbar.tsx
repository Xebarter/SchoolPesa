'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, ChartColumn, GraduationCap, HandHeart, Home, Info, Megaphone, Menu, UserRound, X } from 'lucide-react'
import { NotificationBell } from '@/components/dashboard/notification-bell'
import { Logo } from '@/components/site/logo'
import { Button } from '@/components/ui/button'
import { accountPhoto } from '@/lib/supabase/account'
import { createBrowserClient } from '@/lib/supabase/client'
import type { NotificationItem } from '@/lib/types'
import { cn } from '@/lib/utils'

type Icon = ComponentType<{ className?: string }>

const links: { label: string; href: string; icon: Icon }[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { label: 'Sponsor a Child', href: '/sponsor', icon: GraduationCap },
  { label: 'Our Impact', href: '/impact', icon: ChartColumn },
  { label: 'Stories', href: '/stories', icon: BookOpen },
  { label: 'About', href: '/about', icon: Info },
  { label: 'Get Involved', href: '/get-involved', icon: HandHeart },
]

function isCurrent(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [alerts, setAlerts] = useState<NotificationItem[]>([])

  useEffect(() => {
    const supabase = createBrowserClient()
    if (!supabase) return
    let active = true
    function apply(user: { user_metadata?: Record<string, unknown> } | null) {
      if (!active) return
      setSignedIn(Boolean(user))
      setAvatar(accountPhoto(user?.user_metadata))
    }
    void supabase.auth.getUser().then(({ data }) => apply(data.user))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user ?? null)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!signedIn) {
      setAlerts([])
      return
    }
    let active = true
    function load() {
      void fetch('/api/notifications').then((response) => response.json()).then((data: { items?: NotificationItem[] }) => {
        if (active) setAlerts(data.items ?? [])
      }).catch(() => {
        if (active) setAlerts([])
      })
    }
    load()
    window.addEventListener('focus', load)
    return () => {
      active = false
      window.removeEventListener('focus', load)
    }
  }, [signedIn, pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 bg-cream">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={cn('text-sm font-medium transition', isCurrent(pathname, link.href) ? 'text-ink' : 'text-sage hover:text-ink')}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {signedIn ? <NotificationBell items={alerts} onUpdated={() => { void fetch('/api/notifications').then((response) => response.json()).then((data: { items?: NotificationItem[] }) => setAlerts(data.items ?? [])).catch(() => setAlerts([])) }} /> : null}
          <Link href={signedIn ? '/dashboard' : '/login'} aria-label={signedIn ? 'Account' : 'Sign in'} className="grid size-10 place-items-center overflow-hidden rounded-full border border-line text-forest">
            {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : <UserRound className="size-5" />}
          </Link>
          <Button nativeButton={false} render={<Link href="/donate" />} className="rounded-full bg-brand px-5 text-white shadow-none hover:bg-brand-deep">
            Donate
          </Button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center rounded-xl border border-line text-forest xl:hidden"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>
      {open && createPortal(
        <div className="fixed inset-0 z-50 xl:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Site menu" className="absolute inset-y-0 right-0 flex w-[min(100%,22rem)] flex-col bg-sky text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <Logo light />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Explore</p>
              <nav className="mt-3 flex flex-col gap-1" aria-label="Mobile">
                {links.map((link) => {
                  const active = isCurrent(pathname, link.href)
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium', active ? 'bg-white text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white')}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="size-4 shrink-0" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="border-t border-white/10 p-5">
              <Link href="/donate" onClick={() => setOpen(false)} className="flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-ink hover:bg-cream">
                Donate
              </Link>
              <Link href={signedIn ? '/dashboard' : '/login'} onClick={() => setOpen(false)} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold text-white hover:bg-white/10">
                <span className="grid size-6 place-items-center overflow-hidden rounded-full bg-white/15">
                  {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : <UserRound className="size-3.5" />}
                </span>
                {signedIn ? 'Account' : 'Sign in'}
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  )
}
