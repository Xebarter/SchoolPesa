'use client'

import Link from 'next/link'
import { useState } from 'react'
import { SocialLinks } from '@/components/social-icons'
import { Logo } from '@/components/site/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const explore = [
  ['About', '/about'],
  ['Campaigns', '/campaigns'],
  ['Sponsor a Child', '/sponsor'],
  ['Impact', '/impact'],
  ['Stories', '/stories'],
  ['Gallery', '/gallery'],
  ['News', '/news'],
  ['Events', '/events'],
  ['Get Involved', '/get-involved'],
  ['Donate', '/donate'],
]

const support = [
  ['FAQs', '/faq'],
  ['Contact', '/contact'],
  ['Privacy Policy', '/privacy'],
  ['Terms', '/terms'],
]

export function Footer() {
  const [joined, setJoined] = useState(false)
  return (
    <footer className="bg-forest-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/60">Supporting education. Changing futures. Together, we can help every child learn.</p>
          <div className="mt-5"><SocialLinks light /></div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Explore</h2>
          <div className="mt-4 flex flex-col gap-2 text-sm text-white/60">
            {explore.map(([label, href]) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Support</h2>
          <div className="mt-4 flex flex-col gap-2 text-sm text-white/60">
            {support.map(([label, href]) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Stay in the loop</h2>
          <p className="mt-4 text-sm leading-6 text-white/60">Stories of learning, hope and impact, in your inbox.</p>
          {joined ? (
            <p className="mt-4 text-sm text-gold" role="status">You are on the list. Thank you.</p>
          ) : (
            <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); setJoined(true) }}>
              <Input aria-label="Email address" type="email" required placeholder="Your email" className="border-white/15 bg-white/10 text-white placeholder:text-white/40" />
              <Button className="rounded-full bg-gold text-forest shadow-none hover:bg-[#e1a92f]">Join</Button>
            </form>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-white/40 sm:flex-row sm:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} School Pesa. Built for brighter futures.</span>
          <span>Sample content until Supabase is connected.</span>
        </div>
      </div>
    </footer>
  )
}
