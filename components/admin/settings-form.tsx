'use client'

import { useState, type ComponentProps, type FormEvent } from 'react'
import { saveSettings } from '@/lib/actions'
import { PageIntro, Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'

function Toggle({ label, hint, ...props }: { label: string; hint?: string } & ComponentProps<'input'>) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-sage">{hint}</span> : null}
      </span>
      <input type="checkbox" className="size-4 accent-forest" {...props} />
    </label>
  )
}

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const value = (key: string, fallback = '') => settings[key] ?? fallback

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setError('')
    try {
      await saveSettings({
        name: String(data.get('name') || ''),
        logo: String(data.get('logo') || ''),
        description: String(data.get('description') || ''),
        contact: String(data.get('contact') || ''),
        address: String(data.get('address') || ''),
        currency: String(data.get('currency') || ''),
        seoTitle: String(data.get('seoTitle') || ''),
        seoDescription: String(data.get('seoDescription') || ''),
        socialImage: String(data.get('socialImage') || ''),
        siteStatus: String(data.get('siteStatus') || ''),
        emailNotifications: data.get('emailNotifications') ? '1' : '0',
        smsNotifications: data.get('smsNotifications') ? '1' : '0',
        whatsappNotifications: data.get('whatsappNotifications') ? '1' : '0',
        maintenance: data.get('maintenance') ? '1' : '0',
      })
      setSaved('Settings saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Settings could not be saved.')
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <PageIntro title="Settings" description="Organization profile, payments, notifications and how the public site is described.">
        <Button type="submit" className="rounded-full bg-forest">Save settings</Button>
      </PageIntro>
      <div className="mt-2 grid gap-4 xl:grid-cols-2">
        <Panel title="Organization" description="Shown on the public site and receipts." padded>
          <div className="grid gap-4">
            <Label>Name<Input className="mt-2" name="name" defaultValue={value('name', 'School Pesa')} /></Label>
            <Label>Logo<Input className="mt-2" name="logo" defaultValue={value('logo', '/web-app-manifest-192x192.png')} /></Label>
            <Label>Description<Textarea className="mt-2" name="description" defaultValue={value('description', 'Supporting education. Changing futures.')} /></Label>
            <Label>Contact<Input className="mt-2" name="contact" defaultValue={value('contact', 'hello@schoolpesa.example')} /></Label>
            <Label>Address<Input className="mt-2" name="address" defaultValue={value('address', 'Kampala, Uganda')} /></Label>
          </div>
        </Panel>
        <div className="grid content-start gap-4">
          <Panel title="Payments" description="Gifts are collected with a mobile money prompt." padded>
            <div className="grid gap-4">
              <Label>Currency<Input className="mt-2" name="currency" defaultValue={value('currency', 'UGX')} /></Label>
              <Label>Collection<Input className="mt-2" defaultValue="Mobile money" readOnly /></Label>
            </div>
          </Panel>
          <Panel title="Notifications" description="Channels used when a gift is confirmed." padded>
            <div className="grid gap-2">
              <Toggle name="emailNotifications" label="Email" hint="Donation and campaign updates" defaultChecked={value('emailNotifications', '1') === '1'} />
              <Toggle name="smsNotifications" label="SMS" defaultChecked={value('smsNotifications') === '1'} />
              <Toggle name="whatsappNotifications" label="WhatsApp" defaultChecked={value('whatsappNotifications') === '1'} />
            </div>
          </Panel>
        </div>
        <Panel title="SEO" description="Title, description and the image used when the site is shared." padded>
          <div className="grid gap-4">
            <Label>Site title<Input className="mt-2" name="seoTitle" defaultValue={value('seoTitle', 'School Pesa — Supporting Education. Changing Futures.')} /></Label>
            <Label>Site description<Textarea className="mt-2" name="seoDescription" defaultValue={value('seoDescription', 'Help children and students access the education support they need.')} /></Label>
            <Label>Social image<Input className="mt-2" name="socialImage" defaultValue={value('socialImage', '/school-pesa-hero.png')} /></Label>
          </div>
        </Panel>
        <Panel title="General" description="Publishing state for the public site." padded>
          <div className="grid gap-4">
            <Toggle name="maintenance" label="Maintenance mode" hint="Visitors see a holding page while this is on." defaultChecked={value('maintenance') === '1'} />
            <Label>Site status<Input className="mt-2" name="siteStatus" defaultValue={value('siteStatus', 'Published')} /></Label>
          </div>
        </Panel>
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p role="status" className="bg-mist px-4 py-3 text-sm text-forest">{saved}</p> : null}
    </form>
  )
}
