'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { ReceiptDownload } from '@/components/receipt-download'
import { startDonation } from '@/lib/checkout-actions'
import { formatUGX } from '@/lib/format'
import type { Beneficiary, Campaign, CheckoutDraft, DonationFrequency, SupportTarget } from '@/lib/types'

const amounts = [20000, 50000, 100000, 250000]

export function DonationForm({ campaigns, beneficiaries, focus, anonymousDefault = true }: { campaigns: Campaign[]; beneficiaries: Beneficiary[]; focus?: Campaign; anonymousDefault?: boolean }) {
  const params = useSearchParams()
  const preset = focus ?? campaigns.find((item) => item.slug === params.get('campaign'))
  const child = beneficiaries.find((item) => item.id === params.get('child'))
  const [amount, setAmount] = useState('50000')
  const [custom, setCustom] = useState(false)
  const [frequency, setFrequency] = useState<DonationFrequency>('one-time')
  const [supportTarget, setSupportTarget] = useState<SupportTarget>(child ? 'child' : preset ? 'campaign' : 'general')
  const [picking, setPicking] = useState(false)
  const [campaignId, setCampaignId] = useState(preset?.id ?? campaigns[0]?.id ?? '')
  const [beneficiaryId, setBeneficiaryId] = useState(child?.id ?? beneficiaries[0]?.id ?? '')
  const [anonymous, setAnonymous] = useState(anonymousDefault)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [phone, setPhone] = useState('')
  const [reference, setReference] = useState('')
  const [paymentState, setPaymentState] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const draft: CheckoutDraft = useMemo(() => ({
    amount: Number(amount) || 0,
    frequency,
    supportTarget,
    campaignId: supportTarget === 'campaign' ? campaignId : undefined,
    beneficiaryId: supportTarget === 'child' ? beneficiaryId : undefined,
    name: anonymous ? '' : name,
    email: anonymous ? '' : email,
    phone,
    message: anonymous ? '' : reason,
    anonymous,
  }), [amount, frequency, supportTarget, campaignId, beneficiaryId, anonymous, name, email, reason, phone])

  const campaign = campaigns.find((item) => item.id === draft.campaignId)
  const beneficiary = beneficiaries.find((item) => item.id === draft.beneficiaryId)
  const supportLabel = supportTarget === 'campaign' ? campaign?.title : supportTarget === 'child' ? beneficiary?.displayName : 'where it is needed most'
  const ready = draft.amount >= 500 && phone.trim().length > 0 && (anonymous || (name.trim().length > 0 && reason.trim().length > 0))

  async function prepare(event: FormEvent) {
    event.preventDefault()
    if (!ready || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await startDonation(draft)
      setReference(result.reference)
      setPaymentState('Processing')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The payment could not be started.')
    } finally {
      setSubmitting(false)
    }
  }

  if (reference) {
    const confirmed = paymentState === 'Successful'
    const failed = paymentState === 'Failed' || paymentState === 'Cancelled'
    return (
      <div className="border border-line bg-white px-6 py-14 text-center shadow-[0_24px_60px_-36px_rgba(22,29,36,0.45)] sm:px-10">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest text-white"><Check /></span>
        <h2 className="mt-6 text-3xl font-semibold tracking-[-.03em] text-ink">{confirmed ? 'Your gift is confirmed.' : failed ? 'The payment was not completed.' : 'Approve the prompt on your phone.'}</h2>
        <p className="mx-auto mt-4 max-w-sm leading-7 text-sage">
          {anonymous ? 'This gift is anonymous. ' : ''}
          {formatUGX(draft.amount)} {frequency === 'monthly' ? 'each month' : 'today'} for {supportLabel}.
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[.14em] text-brand">Reference {reference}</p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-sage">{confirmed ? 'Your receipt has been saved to this device.' : failed ? 'You can start the gift again with the same details.' : 'Enter your mobile money PIN when the prompt arrives. Your receipt is downloading now.'}</p>
        <PaymentWatch reference={reference} onStatus={setPaymentState} />
        {failed ? null : <ReceiptDownload reference={reference} />}
        <Button onClick={() => { setReference(''); setPaymentState('') }} className="mt-3 h-11 rounded-full bg-forest px-6 text-white shadow-none hover:bg-brand-deep">Give again</Button>
      </div>
    )
  }

  return (
    <form className={`border border-line bg-white p-4 shadow-[0_24px_60px_-36px_rgba(22,29,36,0.45)] sm:p-8 ${preset ? 'mb-28 sm:mb-0' : ''}`} onSubmit={prepare}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">Amount</p>
        <div className="flex w-full rounded-full bg-cream p-1 sm:w-auto">
          {(['one-time', 'monthly'] as const).map((item) => (
            <button key={item} type="button" onClick={() => setFrequency(item)} className={`h-10 flex-1 rounded-full px-3 text-sm font-semibold transition-colors sm:flex-none sm:px-3.5 ${frequency === item ? 'bg-white text-ink shadow-sm' : 'text-sage hover:text-ink'}`}>{item === 'one-time' ? 'One-time' : 'Monthly'}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {amounts.map((value) => (
          <button key={value} type="button" onClick={() => { setAmount(String(value)); setCustom(false) }} className={`min-h-14 border px-2 py-3 text-sm font-semibold tracking-[-.02em] transition-colors sm:text-lg ${!custom && amount === String(value) ? 'border-brand bg-brand text-white' : 'border-line bg-cream text-ink hover:border-brand hover:text-brand'}`}>
            {formatUGX(value)}
          </button>
        ))}
      </div>
      {custom ? (
        <Label className="mt-3 block">Amount in UGX
          <Input className="mt-2" inputMode="numeric" autoFocus value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))} />
        </Label>
      ) : (
        <button type="button" className="mt-3 text-sm font-semibold text-forest hover:text-brand" onClick={() => { setCustom(true); setAmount('') }}>Enter another amount</button>
      )}

      <div className="mt-8 border-t border-line pt-8">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">Mobile money</p>
        <Label className="mt-4 block">Number for the payment prompt
          <Input className="mt-2 h-12 text-base" inputMode="tel" autoComplete="tel" required placeholder="07XX XXX XXX" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Label>
      </div>

      <div className="mt-8 border-t border-line pt-8">
        {preset ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">This gift supports</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-ink">{preset.title}</p>
            <p className="mt-1 text-sm text-sage">{preset.category} · {preset.location}</p>
            <Link href="/donate" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:text-brand">Give to a different cause</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">Directed to</p>
              {supportTarget === 'general' && !picking ? (
                <button type="button" className="text-sm font-semibold text-forest hover:text-brand" onClick={() => { setPicking(true); setSupportTarget('campaign') }}>Choose</button>
              ) : (
                <button type="button" className="text-sm font-semibold text-forest hover:text-brand" onClick={() => { setSupportTarget('general'); setPicking(false) }}>Where needed</button>
              )}
            </div>
            <p className="mt-3 font-semibold text-ink">{supportLabel === 'where it is needed most' ? 'Education support where it is needed most' : supportLabel}</p>
            {picking && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSupportTarget('campaign')} className={`h-11 flex-1 rounded-full px-4 text-sm font-semibold ${supportTarget === 'campaign' ? 'bg-forest text-white' : 'bg-cream text-sage'}`}>Campaign</button>
                  <button type="button" onClick={() => setSupportTarget('child')} className={`h-11 flex-1 rounded-full px-4 text-sm font-semibold ${supportTarget === 'child' ? 'bg-forest text-white' : 'bg-cream text-sage'}`}>Child</button>
                </div>
                {supportTarget === 'campaign' && (
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                    {campaigns.map((item) => (
                      <button key={item.id} type="button" onClick={() => setCampaignId(item.id)} className={`block w-full truncate px-4 py-3 text-left text-sm font-semibold ${campaignId === item.id ? 'bg-forest text-white' : 'bg-cream text-ink'}`}>{item.title}</button>
                    ))}
                  </div>
                )}
                {supportTarget === 'child' && (
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                    {beneficiaries.map((item) => (
                      <button key={item.id} type="button" onClick={() => setBeneficiaryId(item.id)} className={`block w-full truncate px-4 py-3 text-left text-sm font-semibold ${beneficiaryId === item.id ? 'bg-forest text-white' : 'bg-cream text-ink'}`}>{item.displayName} · {item.level}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {supportTarget !== 'general' && !picking ? (
              <button type="button" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:text-brand" onClick={() => setPicking(true)}>Change</button>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-8 border-t border-line pt-8">
        <button
          type="button"
          aria-pressed={anonymous}
          onClick={() => setAnonymous((value) => !value)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span>
            <span className="block text-sm font-semibold text-ink">Give anonymously</span>
            <span className="mt-1 block text-sm text-sage">{anonymous ? 'Your name stays private.' : 'Your name and reason are recorded with the gift. Email is optional.'}</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${anonymous ? 'bg-forest' : 'bg-line'}`}>
            <span className={`absolute top-0.5 size-6 rounded-full bg-white transition-transform ${anonymous ? 'left-5' : 'left-0.5'}`} />
          </span>
        </button>

        {!anonymous && (
          <div className="mt-5 flex flex-col gap-4">
            <Label>Name<Input className="mt-2" required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></Label>
            <Label>Email <span className="font-normal text-sage">(optional)</span><Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></Label>
            <Label>Reason for this gift<Textarea className="mt-2" required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What moved you to give?" /></Label>
          </div>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-ink" role="alert">{error}</p> : null}
      {!preset ? <p className="mt-4 text-center text-xs leading-5 text-sage">Approve the prompt on your phone to complete the gift.</p> : null}

      <div className={preset ? 'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0' : 'mt-4'}>
        <Button type="submit" className="h-12 w-full rounded-full bg-brand text-base text-white shadow-none hover:bg-brand-deep" disabled={!ready || submitting}>
          {submitting ? 'Sending prompt…' : `Donate ${draft.amount > 0 ? formatUGX(draft.amount) : ''}`}
        </Button>
        {preset ? <p className="mt-2 hidden text-center text-xs leading-5 text-sage sm:block">Approve the prompt on your phone to complete the gift.</p> : null}
      </div>
    </form>
  )
}

function PaymentWatch({ reference, onStatus }: { reference: string; onStatus: (status: string) => void }) {
  useEffect(() => {
    let stopped = false
    async function look() {
      const response = await fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`)
      if (!response.ok || stopped) return
      const body = await response.json() as { status?: string }
      if (body.status) onStatus(body.status)
      if (body.status === 'Successful' || body.status === 'Failed' || body.status === 'Cancelled' || body.status === 'Refunded') stopped = true
    }
    const timer = setInterval(look, 4000)
    return () => { stopped = true; clearInterval(timer) }
  }, [reference, onStatus])
  return null
}
