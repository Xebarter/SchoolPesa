'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

export default function Page() {
  const [saved, setSaved] = useState(false)
  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <aside className="h-fit rounded-2xl border border-line bg-white p-6 text-center shadow-sm shadow-forest/5">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-forest text-lg font-semibold text-white">SN</span>
        <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">Sarah Nakato</h1>
        <p className="mt-1 text-sm text-sage">Donor · Kampala</p>
        <p className="mt-4 rounded-xl bg-mist px-3 py-2 text-xs text-forest">Giving since September 2026</p>
      </aside>
      <form
        className="rounded-2xl border border-line bg-white p-6 shadow-sm shadow-forest/5"
        onSubmit={(event) => { event.preventDefault(); setSaved(true) }}
      >
        <h2 className="text-lg font-semibold tracking-tight text-ink">Profile</h2>
        <p className="mt-1 text-sm text-sage">These details appear on receipts and campaign updates.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Label className="sm:col-span-2">Name<Input className="mt-2" defaultValue="Sarah Nakato" /></Label>
          <Label>Email<Input className="mt-2" type="email" defaultValue="sarah@example.com" /></Label>
          <Label>Phone<Input className="mt-2" defaultValue="+256 700 000 010" /></Label>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button className="rounded-full bg-forest px-5 text-white hover:bg-[#285842]">Save profile</Button>
          {saved ? <p role="status" className="text-sm text-forest">Profile saved in this session.</p> : null}
        </div>
      </form>
    </div>
  )
}
