import { PageIntro, Panel, StatusPill } from '@/components/admin/ui'
import { rolePermissions, users } from '@/lib/data'

export const metadata = { title: 'Admin users' }

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function Page() {
  return (
    <div>
      <PageIntro title="Roles" description="Who can publish, record finance, and read the audit log." />
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(rolePermissions) as Array<keyof typeof rolePermissions>).map((role) => (
          <Panel key={role} title={role} description={`${rolePermissions[role].length} permissions`} padded>
            <ul className="flex flex-wrap gap-2">
              {rolePermissions[role].map((permission) => (
                <li key={permission} className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-forest">{permission}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
      <div className="mt-6">
        <Panel title="Team" description={`${users.length} admin accounts`}>
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
                <StatusPill value={user.role} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
