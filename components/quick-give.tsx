'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Check, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { ReceiptDownload } from '@/components/receipt-download'
import { startDonation } from '@/lib/checkout-actions'
import { formatUGX } from '@/lib/format'

const amounts = [20000, 50000, 100000, 250000]

export function QuickGive() {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('50000')
  const [custom, setCustom] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reference, setReference] = useState('')
  const [paymentState, setPaymentState] = useState('')

  const gift = Number(amount) || 0
  const emailOk = email.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const ready = gift >= 500 && phone.trim().length > 0 && emailOk

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [open])

  useEffect(() => {
    if (!reference) return
    let stopped = false
    async function look() {
      const response = await fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`)
      if (!response.ok || stopped) return
      const body = await response.json() as { status?: string }
      if (body.status) setPaymentState(body.status)
      if (body.status === 'Successful' || body.status === 'Failed' || body.status === 'Cancelled' || body.status === 'Refunded') stopped = true
    }
    const timer = setInterval(look, 4000)
    void look()
    return () => { stopped = true; clearInterval(timer) }
  }, [reference])

  async function give(event: FormEvent) {
    event.preventDefault()
    if (!ready || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await startDonation({
        amount: gift,
        frequency: 'one-time',
        supportTarget: 'general',
        name: '',
        email: email.trim(),
        phone,
        message: '',
        anonymous: true,
      })
      setReference(result.reference)
      setPaymentState('Processing')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The payment could not be started.'
      setError(/paytota/i.test(message) ? 'The payment could not be started. Try again in a moment.' : message)
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setReference('')
    setPaymentState('')
    setError('')
  }

  const confirmed = paymentState === 'Successful'
  const failed = paymentState === 'Failed' || paymentState === 'Cancelled'

  return (
    <>
      {open ? <div className="fixed inset-0 z-30 bg-ink/40" /> : null}
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-x-3 bottom-[calc(8.75rem+env(safe-area-inset-bottom))] z-40 flex max-h-[calc(100dvh-10rem-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-28px_rgba(22,29,36,0.55)] sm:inset-x-auto sm:right-5 sm:w-[22rem]"
        >
          {reference ? (
            <div className="overflow-y-auto px-4 py-6 text-center sm:px-5">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-forest text-white"><Check className="size-5" /></span>
              <h2 id={titleId} className="mt-4 text-2xl font-semibold tracking-[-.03em] text-ink">
                {confirmed ? 'Your gift is confirmed.' : failed ? 'The payment was not completed.' : 'Approve the prompt on your phone.'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-sage">
                {formatUGX(gift)} for education support where it is needed most.
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[.14em] text-brand">Reference {reference}</p>
              <p className="mt-3 text-sm leading-6 text-sage">
                {confirmed ? 'Your receipt has been saved to this device.' : failed ? 'You can start again with the same phone number.' : 'Enter your mobile money PIN when the prompt arrives. Your receipt is downloading now.'}
              </p>
              {failed ? null : <ReceiptDownload reference={reference} />}
              <Button type="button" onClick={reset} className="mt-3 h-12 w-full rounded-full bg-forest text-base text-white shadow-none hover:bg-brand-deep">Give again</Button>
            </div>
          ) : (
            <form onSubmit={give} className="flex min-h-0 flex-col">
              <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
                <h2 id={titleId} className="text-2xl font-semibold tracking-[-.03em] text-ink">Give</h2>
                <p className="mt-1 text-sm leading-6 text-sage">Choose an amount, then enter your phone number. Email is optional.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {amounts.map((value) => (
                    <button key={value} type="button" onClick={() => { setAmount(String(value)); setCustom(false) }} className={`min-h-12 border px-2 text-sm font-semibold tracking-[-.02em] transition-colors ${!custom && amount === String(value) ? 'border-brand bg-brand text-white' : 'border-line bg-cream text-ink hover:border-brand'}`}>
                      {formatUGX(value)}
                    </button>
                  ))}
                </div>
                {custom ? (
                  <Label className="mt-3 block">Amount in UGX
                    <Input className="mt-2 h-12 text-base" inputMode="numeric" autoFocus value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))} />
                  </Label>
                ) : (
                  <button type="button" className="mt-3 min-h-11 text-sm font-semibold text-forest hover:text-brand" onClick={() => { setCustom(true); setAmount('') }}>Enter another amount</button>
                )}
                <Label className="mt-4 block">Phone number
                  <Input className="mt-2 h-12 text-base" inputMode="tel" autoComplete="tel" required placeholder="07XX XXX XXX" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </Label>
                <Label className="mt-4 block">Email <span className="font-normal text-sage">(optional)</span>
                  <Input className="mt-2 h-12 text-base" type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                </Label>
                {error ? <p className="mt-3 text-sm text-ink" role="alert">{error}</p> : null}
              </div>
              <div className="shrink-0 border-t border-line px-4 py-3 sm:px-5">
                <Button type="submit" className="h-12 w-full rounded-full bg-brand text-base text-white shadow-none hover:bg-brand-deep" disabled={!ready || submitting}>
                  {submitting ? 'Sending prompt…' : `Give ${gift > 0 ? formatUGX(gift) : ''}`}
                </Button>
                <p className="mt-2 text-center text-xs leading-5 text-sage">A payment prompt is sent to your phone.</p>
              </div>
            </form>
          )}
        </div>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="relative z-40 inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(22,29,36,0.28)] transition-transform hover:scale-105 hover:bg-brand-deep"
      >
        <Heart className="size-4 fill-current" />
        Give
      </button>
    </>
  )
}
