import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/shell'
import { requireAdmin } from '@/lib/supabase/session'

export const metadata = { title: 'Admin' }

export default async function Layout({ children }: { children: ReactNode }) {
  await requireAdmin()
  return <AdminShell>{children}</AdminShell>
}
