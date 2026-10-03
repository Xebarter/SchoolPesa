'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'

const links = [
  ['Overview', '/dashboard'],
  ['My Donations', '/dashboard/donations'],
  ['My Campaigns', '/dashboard/campaigns'],
  ['Sponsored Children', '/dashboard/sponsored'],
  ['Receipts', '/dashboard/receipts'],
  ['Impact Updates', '/dashboard/updates'],
  ['Profile', '/dashboard/profile'],
  ['Notifications', '/dashboard/notifications'],
  ['Settings', '/dashboard/settings'],
]

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1" aria-label="Donor">
      {links.map(([label, href]) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} onClick={onNavigate} className={`rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-mist text-forest' : 'text-sage hover:bg-mist'}`}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-line bg-white p-5 lg:block">
        <Link href="/" className="text-sm font-semibold text-forest">School Pesa</Link>
        <p className="mb-4 mt-1 text-xs text-sage">Your impact</p>
        <Nav />
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <button type="button" className="rounded-full border border-line px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(true)}><Menu className="mr-2 inline size-4" />Menu</button>
          <p className="text-sm font-semibold">Donor dashboard</p>
          <Link href="/" className="text-sm font-semibold text-forest">View site</Link>
        </header>
        <div className="p-5 lg:p-8">{children}</div>
      </div>
      <Sheet open={open} title="Your impact" onClose={() => setOpen(false)}>
        <Nav onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}
