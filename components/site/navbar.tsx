'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'

const links = [
  ['Home', '/'],
  ['Campaigns', '/campaigns'],
  ['Sponsor a Child', '/sponsor'],
  ['Our Impact', '/impact'],
  ['Stories', '/stories'],
  ['About', '/about'],
  ['Get Involved', '/get-involved'],
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-medium text-sage transition hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-sage sm:block">
            Sign in
          </Link>
          <Button nativeButton={false} render={<Link href="/donate" />} className="rounded-full bg-brand px-5 text-white shadow-none hover:bg-brand-deep">
            Donate
          </Button>
          <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full border border-line xl:hidden" aria-label="Open menu">
            <Menu />
          </button>
        </div>
      </div>
      <Sheet open={open} title="Menu" onClose={() => setOpen(false)}>
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-mist">
              {label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-mist">
            Sign in
          </Link>
        </nav>
      </Sheet>
    </header>
  )
}
