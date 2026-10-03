'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, ChartColumn, GraduationCap, HandHeart, Home, Info, Megaphone, Menu, X } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { Button } from '@/components/ui/button'
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

  useEffect(() => {
    setOpen(false)
  }, [pathname])

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
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
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
          <Link href="/login" className="hidden text-sm font-medium text-sage hover:text-ink sm:block">
            Sign in
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
          <button type="button" className="absolute inset-0 bg-forest-deep/55 backdrop-blur-[2px]" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Site menu" className="absolute inset-y-0 right-0 flex w-[min(100%,22rem)] flex-col bg-forest-deep text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <Logo light />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Explore</p>
              <nav className="mt-3 flex flex-col gap-1" aria-label="Mobile">
                {links.map((link) => {
                  const active = isCurrent(pathname, link.href)
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium', active ? 'bg-white text-forest' : 'text-white/80 hover:bg-white/10 hover:text-white')}
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
              <Link href="/donate" onClick={() => setOpen(false)} className="flex h-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-deep">
                Donate
              </Link>
              <Link href="/login" onClick={() => setOpen(false)} className="mt-3 flex h-11 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  )
}
