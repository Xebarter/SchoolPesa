'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

export default function Page() {
  const [saved, setSaved] = useState(false)
  return (
    <form className="max-w-lg" onSubmit={(event) => { event.preventDefault(); setSaved(true) }}>
      <h1 className="text-3xl font-semibold">Profile</h1>
      <div className="mt-6 grid gap-4">
        <Label>Name<Input className="mt-2" defaultValue="Sarah Nakato" /></Label>
        <Label>Email<Input className="mt-2" type="email" defaultValue="sarah@example.com" /></Label>
        <Label>Phone<Input className="mt-2" defaultValue="+256 700 000 010" /></Label>
        <Button className="rounded-full bg-forest">Save profile</Button>
        {saved && <p role="status" className="text-sm text-forest">Profile saved in this session.</p>}
      </div>
    </form>
  )
}
