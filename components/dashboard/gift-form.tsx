'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { createDonationRecord } from '@/lib/donor-actions'
import type { Beneficiary, Campaign } from '@/lib/types'

export function GiftForm({ campaigns, learners, onDone }: { campaigns: Pick<Campaign, 'id' | 'title'>[]; learners: Pick<Beneficiary, 'id' | 'displayName'>[]; onDone?: () => void }) {
  const router = useRouter()
  const [amount, setAmount] = useState('50000')
  const [message, setMessage] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    try {
      await createDonationRecord({ amount: Number(amount), message, campaignId: campaignId || undefined, beneficiaryId: beneficiaryId || undefined })
      setMessage('')
      onDone?.()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The gift could not be saved.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-line bg-white p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Record a pending gift</h2>
      <p className="mt-1 text-sm leading-6 text-sage">This keeps the intention on your account. A confirmed payment still comes from Give.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Label>Amount in UGX<Input className="mt-2" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))} required /></Label>
        <Label>Campaign
          <Select className="mt-2" value={campaignId} onChange={(event) => setCampaignId(event.target.value)} aria-label="Campaign">
            <option value="">General support</option>
            {campaigns.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </Select>
        </Label>
        <Label>Child
          <Select className="mt-2" value={beneficiaryId} onChange={(event) => setBeneficiaryId(event.target.value)} aria-label="Child">
            <option value="">No specific child</option>
            {learners.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
          </Select>
        </Label>
        <Label className="sm:col-span-2">Note<Textarea className="mt-2" value={message} onChange={(event) => setMessage(event.target.value)} /></Label>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
      <Button className="mt-4 h-11 rounded-full bg-brand px-5 text-white hover:bg-brand-deep" disabled={pending}>{pending ? 'Saving…' : 'Save gift'}</Button>
    </form>
  )
}
