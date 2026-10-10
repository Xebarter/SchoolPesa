'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { createAdminDonation } from '@/lib/admin-actions'
import type { Campaign, DonationStatus } from '@/lib/types'

export function DonationRecord({ campaigns }: { campaigns: Pick<Campaign, 'id' | 'title'>[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      await createAdminDonation({
        donorName: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        amount: Number(data.get('amount') || 0),
        campaignId: String(data.get('campaign') || '') || undefined,
        status: String(data.get('status') || 'Pending') as DonationStatus,
        message: String(data.get('message') || ''),
      })
      event.currentTarget.reset()
      setOpen(false)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The gift could not be saved.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-6">
      <button type="button" className="text-sm font-semibold text-forest" onClick={() => setOpen((value) => !value)}>{open ? 'Close' : 'Record a gift'}</button>
      {open ? (
        <form onSubmit={onSubmit} className="mt-3 grid gap-3 bg-mist p-5 md:grid-cols-2">
          <Label>Donor name<Input className="mt-2" name="name" required /></Label>
          <Label>Email<Input className="mt-2" name="email" type="email" required /></Label>
          <Label>Amount in UGX<Input className="mt-2" name="amount" inputMode="numeric" required /></Label>
          <Label>Campaign
            <Select className="mt-2" name="campaign" defaultValue="">
              <option value="">General support</option>
              {campaigns.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </Select>
          </Label>
          <Label>Status
            <Select className="mt-2" name="status" defaultValue="Pending">
              {['Pending', 'Processing', 'Successful', 'Failed', 'Cancelled', 'Refunded'].map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Label>
          <Label className="md:col-span-2">Note<Textarea className="mt-2" name="message" /></Label>
          {error ? <p className="text-sm text-destructive md:col-span-2" role="alert">{error}</p> : null}
          <Button className="rounded-full bg-forest" disabled={pending}>{pending ? 'Saving…' : 'Save gift'}</Button>
        </form>
      ) : null}
    </div>
  )
}
