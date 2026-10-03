'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { clearDemoUser } from '@/lib/auth-client'

export default function Page() {
  const router = useRouter()
  const [emailOn, setEmailOn] = useState(true)
  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <label className="mt-6 flex items-center gap-3 text-sm">
        <input type="checkbox" checked={emailOn} onChange={(event) => setEmailOn(event.target.checked)} />
        Email me when a campaign I support posts an update
      </label>
      <p className="mt-3 text-sm text-sage">{emailOn ? 'Updates will be emailed when notifications are connected.' : 'Email updates are off for this session.'}</p>
      <Button className="mt-6 rounded-full" variant="outline" onClick={() => { clearDemoUser(); router.push('/') }}>Sign out</Button>
    </div>
  )
}
