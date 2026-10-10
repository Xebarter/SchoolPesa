'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PageIntro, Panel, StatusPill } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { deleteUser, saveUser } from '@/lib/admin-actions'
import { rolePermissions } from '@/lib/data/people'
import type { User } from '@/lib/types'

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

const roles = Object.keys(rolePermissions) as User['role'][]

export function UserBoard({ users }: { users: User[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | undefined>()
  const [error, setError] = useState('')
  const current = users.find((item) => item.id === editing)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setError('')
    try {
      await saveUser({
        id: editing,
        name: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        role: String(data.get('role') || 'Viewer'),
        phone: String(data.get('phone') || ''),
      })
      setEditing(undefined)
      event.currentTarget.reset()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The user could not be saved.')
    }
  }

  return (
    <div>
      <PageIntro title="Roles" description="Add a team account, change a role, or remove the record." />
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <Panel key={role} title={role} description={`${rolePermissions[role].length} permissions`} padded>
            <ul className="flex flex-wrap gap-2">
              {rolePermissions[role].map((permission) => (
                <li key={permission} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-forest">{permission}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
      <Panel title={editing ? 'Edit account' : 'Add an account'} className="mt-6" padded>
        <form key={editing ?? 'new-user'} className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <Label>Name<Input className="mt-2" name="name" required defaultValue={current?.name} /></Label>
          <Label>Email<Input className="mt-2" name="email" type="email" required defaultValue={current?.email} /></Label>
          <Label>Phone<Input className="mt-2" name="phone" defaultValue={current?.phone} /></Label>
          <Label>Role
            <Select className="mt-2" name="role" defaultValue={current?.role ?? 'Viewer'}>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </Select>
          </Label>
          {error ? <p className="text-sm text-destructive md:col-span-2" role="alert">{error}</p> : null}
          <div className="flex gap-2">
            <Button className="rounded-full bg-forest">{editing ? 'Update account' : 'Save account'}</Button>
            {editing ? <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditing(undefined)}>Cancel</Button> : null}
          </div>
        </form>
      </Panel>
      <div className="mt-6">
        <Panel title="Team" description={`${users.length} accounts`}>
          <ul className="divide-y divide-line">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">{initials(user.name)}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{user.name}</p>
                    <p className="text-xs text-sage">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={user.role} />
                  <button type="button" className="text-xs font-semibold text-forest" onClick={() => setEditing(user.id)}>Edit</button>
                  <button type="button" className="text-xs font-semibold text-ink" onClick={() => void deleteUser(user.id).then(() => router.refresh()).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'The account could not be removed.'))}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
