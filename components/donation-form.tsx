'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { pendingPaymentProvider } from '@/lib/payments'
import { formatUGX } from '@/lib/format'
import type { Beneficiary, Campaign, CheckoutDraft, DonationFrequency, SupportTarget } from '@/lib/types'

const amounts = [20000, 50000, 100000, 250000]

export function DonationForm({ campaigns, beneficiaries }: { campaigns: Campaign[]; beneficiaries: Beneficiary[] }) {
  const params = useSearchParams()
  const preset = campaigns.find((item) => item.slug === params.get('campaign'))
  const child = beneficiaries.find((item) => item.id === params.get('child'))
  const [step, setStep] = useState(0)
  const [amount, setAmount] = useState('50000')
  const [frequency, setFrequency] = useState<DonationFrequency>('one-time')
  const [supportTarget, setSupportTarget] = useState<SupportTarget>(child ? 'child' : preset ? 'campaign' : 'general')
  const [campaignId, setCampaignId] = useState(preset?.id ?? campaigns[0]?.id ?? '')
  const [beneficiaryId, setBeneficiaryId] = useState(child?.id ?? beneficiaries[0]?.id ?? '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [reference, setReference] = useState('')

  const draft: CheckoutDraft = useMemo(() => ({
    amount: Number(amount) || 0,
    frequency,
    supportTarget,
    campaignId: supportTarget === 'campaign' ? campaignId : undefined,
    beneficiaryId: supportTarget === 'child' ? beneficiaryId : undefined,
    name,
    email,
    phone,
    message,
    anonymous,
  }), [amount, frequency, supportTarget, campaignId, beneficiaryId, name, email, phone, message, anonymous])

  const campaign = campaigns.find((item) => item.id === draft.campaignId)
  const beneficiary = beneficiaries.find((item) => item.id === draft.beneficiaryId)
  const supportLabel = supportTarget === 'campaign' ? campaign?.title : supportTarget === 'child' ? beneficiary?.displayName : 'Education support where most needed'

  async function prepare() {
    const result = await pendingPaymentProvider.prepareCheckout(draft)
    setReference(result.reference)
    setStep(4)
  }

  if (step === 4) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-[#cfe0d3] bg-mist p-10 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest text-white"><Check /></span>
        <h2 className="mt-5 text-2xl font-semibold text-forest">Thank you for supporting education.</h2>
        <p className="mt-3 text-sage">Your {formatUGX(draft.amount)} {frequency} gift is ready for a secure payment provider. Reference {reference}.</p>
        <p className="mt-2 text-sm text-sage">No charge has been made. A provider can complete this checkout later.</p>
        <Button onClick={() => setStep(0)} className="mt-7 rounded-full bg-forest">Start another gift</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-line bg-white p-6 shadow-xl shadow-forest/5 sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-wider text-sage">Step {step + 1} of 4</p>
      {step === 0 && (
        <div>
          <h2 className="text-xl font-semibold">Choose your contribution</h2>
          <div className="mt-4 flex gap-2">
            {(['one-time', 'monthly'] as const).map((item) => (
              <button key={item} type="button" onClick={() => setFrequency(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${frequency === item ? 'bg-forest text-white' : 'border border-line text-sage'}`}>{item === 'one-time' ? 'One-time' : 'Monthly'}</button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {amounts.map((value) => (
              <button key={value} type="button" onClick={() => setAmount(String(value))} className={`rounded-xl border py-3 text-sm font-semibold ${amount === String(value) ? 'border-brand bg-[#fff4ed] text-brand-deep' : 'border-line text-sage'}`}>
                {formatUGX(value)}
              </button>
            ))}
          </div>
          <Label className="mt-4 block">Other amount
            <Input className="mt-2" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Label>
        </div>
      )}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold">Who would you like to support?</h2>
          <div className="mt-4 flex flex-col gap-2">
            {[
              ['campaign', 'This campaign'],
              ['child', 'A specific child'],
              ['general', 'Education support where most needed'],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm">
                <input type="radio" name="support" checked={supportTarget === value} onChange={() => setSupportTarget(value as SupportTarget)} />
                {label}
              </label>
            ))}
          </div>
          {supportTarget === 'campaign' && (
            <Label className="mt-4 block">Campaign
              <Select className="mt-2" value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
                {campaigns.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </Select>
            </Label>
          )}
          {supportTarget === 'child' && (
            <Label className="mt-4 block">Learner
              <Select className="mt-2" value={beneficiaryId} onChange={(event) => setBeneficiaryId(event.target.value)}>
                {beneficiaries.map((item) => <option key={item.id} value={item.id}>{item.displayName} · {item.level}</option>)}
              </Select>
            </Label>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Your details</h2>
          <Label>Name<Input className="mt-2" required value={name} onChange={(event) => setName(event.target.value)} /></Label>
          <Label>Email<Input className="mt-2" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></Label>
          <Label>Phone<Input className="mt-2" value={phone} onChange={(event) => setPhone(event.target.value)} /></Label>
          <Label>Optional message<Textarea className="mt-2" value={message} onChange={(event) => setMessage(event.target.value)} /></Label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> Make my donation anonymous</label>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold">Review before payment</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-sage">Amount</dt><dd className="font-semibold">{formatUGX(draft.amount)} · {frequency}</dd></div>
            <div className="flex justify-between"><dt className="text-sage">Support</dt><dd className="font-semibold">{supportLabel}</dd></div>
            <div className="flex justify-between"><dt className="text-sage">Donor</dt><dd className="font-semibold">{anonymous ? 'Anonymous' : name}</dd></div>
            <div className="flex justify-between"><dt className="text-sage">Email</dt><dd>{email}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-sage">Continue prepares this gift for a payment provider. School Pesa does not charge a card on this screen.</p>
        </div>
      )}
      <div className="mt-6 flex gap-3">
        {step > 0 && <Button variant="outline" className="rounded-full" onClick={() => setStep((value) => value - 1)}>Back</Button>}
        {step < 3 && (
          <Button className="rounded-full bg-brand text-white shadow-none hover:bg-brand-deep" onClick={() => setStep((value) => value + 1)} disabled={step === 0 && Number(amount) <= 0 || (step === 2 && (!name || !email))}>
            Continue
          </Button>
        )}
        {step === 3 && <Button className="rounded-full bg-brand text-white shadow-none hover:bg-brand-deep" onClick={prepare}>Continue to payment</Button>}
      </div>
    </div>
  )
}
