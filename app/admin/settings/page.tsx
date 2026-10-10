import { SettingsForm } from '@/components/admin/settings-form'
import { getSettings } from '@/lib/data'

export const metadata = { title: 'Admin settings' }

export default function Page() {
  return <SettingsForm settings={getSettings()} />
}
