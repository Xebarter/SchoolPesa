import { accountName, accountPhoto } from '@/lib/supabase/account'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

const adminRoles = new Set(['Super Admin', 'Finance Admin', 'Campaign Manager', 'Content Manager', 'Auditor'])

function isAdminRole(role: string) {
  return adminRoles.has(role)
}

export async function currentAccount() {
  const supabase = await createServerClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    role: typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : '',
    name: accountName(user.user_metadata, user.email),
    phone: typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : '',
    photo: accountPhoto(user.user_metadata),
    createdAt: user.created_at ?? '',
    provider: typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : 'email',
  }
}

export async function requireAdmin() {
  const account = await currentAccount()
  if (!account) redirect('/login?next=%2Fadmin')
  if (!isAdminRole(account.role)) redirect('/dashboard')
  return account
}

export async function assertAdmin() {
  const account = await currentAccount()
  if (!account || !isAdminRole(account.role)) {
    throw new Error('Administrator access is required.')
  }
  return account
}
