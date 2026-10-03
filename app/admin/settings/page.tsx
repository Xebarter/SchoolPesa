'use client'

import { useState, type ComponentProps } from 'react'
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

export default function Page() {
  const [saved, setSaved] = useState('')
  return (
    <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); setSaved('Settings saved in this session.') }}>
      <PageIntro title="Settings" description="Organization profile, payments, notifications and how the public site is described.">
        <Button type="submit" className="rounded-full bg-forest">Save settings</Button>
      </PageIntro>
      <div className="mt-2 grid gap-4 xl:grid-cols-2">
        <Panel title="Organization" description="Shown on the public site and receipts." padded>
          <div className="grid gap-4">
            <Label>Name<Input className="mt-2" defaultValue="School Pesa" /></Label>
            <Label>Logo<Input className="mt-2" defaultValue="/web-app-manifest-192x192.png" /></Label>
            <Label>Description<Textarea className="mt-2" defaultValue="Supporting education. Changing futures." /></Label>
            <Label>Contact<Input className="mt-2" defaultValue="hello@schoolpesa.example" /></Label>
            <Label>Address<Input className="mt-2" defaultValue="Kampala, Uganda" /></Label>
          </div>
        </Panel>
        <div className="grid content-start gap-4">
          <Panel title="Payments" description="No provider is connected. Checkout only prepares a reference." padded>
            <div className="grid gap-4">
              <Label>Currency<Input className="mt-2" defaultValue="UGX" /></Label>
              <Label>Payment providers<Input className="mt-2" defaultValue="Not connected" /></Label>
            </div>
          </Panel>
          <Panel title="Notifications" description="Channels used when a live provider is connected." padded>
            <div className="grid gap-2">
              <Toggle label="Email" hint="Donation and campaign updates" defaultChecked />
              <Toggle label="SMS" />
              <Toggle label="WhatsApp" />
            </div>
          </Panel>
        </div>
        <Panel title="SEO" description="Title, description and the image used when the site is shared." padded>
          <div className="grid gap-4">
            <Label>Site title<Input className="mt-2" defaultValue="School Pesa — Supporting Education. Changing Futures." /></Label>
            <Label>Site description<Textarea className="mt-2" defaultValue="Help children and students access the education support they need." /></Label>
            <Label>Social image<Input className="mt-2" defaultValue="/school-pesa-hero.png" /></Label>
          </div>
        </Panel>
        <Panel title="General" description="Publishing state for the public site." padded>
          <div className="grid gap-4">
            <Toggle label="Maintenance mode" hint="Visitors see a holding page while this is on." />
            <Label>Site status<Input className="mt-2" defaultValue="Published" /></Label>
          </div>
        </Panel>
      </div>
      {saved && <p role="status" className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-forest shadow-sm">{saved}</p>}
    </form>
  )
}
