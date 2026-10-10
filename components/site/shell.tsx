import type { ReactNode } from 'react'
import { Footer } from '@/components/site/footer'
import { Navbar } from '@/components/site/navbar'

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="bg-cream">{children}</main>
      <Footer />
    </>
  )
}
