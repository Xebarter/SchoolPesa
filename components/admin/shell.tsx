'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { ChartColumn, FileText, GraduationCap, Images, Landmark, LayoutDashboard, Megaphone, Menu, Newspaper, ScrollText, Settings, Shield, Users, Wallet, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Icon = ComponentType<{ className?: string }>

const groups: { label: string; links: { label: string; href: string; icon: Icon }[] }[] = [
  { label: 'Workspace', links: [{ label: 'Overview', href: '/admin', icon: LayoutDashboard }] },
  { label: 'Fundraising', links: [
    { label: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
    { label: 'Beneficiaries', href: '/admin/beneficiaries', icon: GraduationCap },
    { label: 'Donations', href: '/admin/donations', icon: Wallet },
  ] },
  { label: 'Finance', links: [
    { label: 'Allocations', href: '/admin/finance', icon: Landmark },
    { label: 'Reports', href: '/admin/reports', icon: ChartColumn },
  ] },
  { label: 'Impact', links: [
    { label: 'Stories', href: '/admin/stories', icon: FileText },
    { label: 'Gallery', href: '/admin/gallery', icon: Images },
  ] },
  { label: 'Organization', links: [
    { label: 'Content', href: '/admin/content', icon: Newspaper },
    { label: 'People', href: '/admin/people', icon: Users },
    { label: 'Roles', href: '/admin/users', icon: Shield },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
    { label: 'Audit log', href: '/admin/audit-logs', icon: ScrollText },
  ] },
]

const titles = Object.fromEntries(groups.flatMap((group) => group.links.map((link) => [link.href, link.label])))

function Nav({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname()
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{group.label}</p>
          <nav className="mt-2 flex flex-col gap-0.5" aria-label={group.label}>
            {group.links.map((link) => {
              const active = pathname === link.href
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    active ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3">
      <Image src="/web-app-manifest-192x192.png" alt="" width={36} height={36} className="size-9 rounded-xl bg-white" />
      <span>
        <span className="block text-sm font-semibold tracking-tight text-white">School Pesa</span>
        <span className="block text-xs text-white/50">Administration</span>
      </span>
    </Link>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const title = titles[pathname] ?? 'Admin'

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
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[17.5rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-forest-deep lg:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <Nav />
        </div>
        <div className="p-4">
          <div className="px-3 py-3">
            <p className="text-sm font-semibold text-white">Sarah Nakato</p>
            <p className="text-xs text-white/50">Super Admin</p>
          </div>
          <Link href="/" className="mt-3 block px-3 text-xs font-semibold text-white/70 hover:text-white">View public site</Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-cream px-4 lg:px-8">
          <button
            type="button"
            className="grid size-10 place-items-center bg-mist text-forest lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Admin</p>
            <p className="truncate text-sm font-semibold text-ink">{title}</p>
          </div>
          <Link href="/dashboard" className="bg-mist px-3 py-1.5 text-xs font-semibold text-forest hover:bg-forest hover:text-white">Donor view</Link>
        </header>
        <div className="px-4 pb-8 pt-4 lg:px-8 lg:pb-10">{children}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Admin menu" className="absolute inset-y-0 left-0 flex w-[min(100%,19rem)] flex-col bg-forest-deep">
            <div className="flex items-center justify-between px-5 py-5">
              <Brand />
              <button type="button" className="grid size-9 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <Nav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
