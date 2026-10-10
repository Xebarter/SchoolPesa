'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function receiptUrl(reference: string) {
  return `/api/payments/receipt?reference=${encodeURIComponent(reference)}`
}

export function downloadReceipt(reference: string) {
  const frame = document.createElement('iframe')
  frame.hidden = true
  frame.src = receiptUrl(reference)
  document.body.appendChild(frame)
  window.setTimeout(() => frame.remove(), 4000)
}

export function ReceiptDownload({ reference }: { reference: string }) {
  useEffect(() => {
    downloadReceipt(reference)
  }, [reference])

  return (
    <Button type="button" onClick={() => downloadReceipt(reference)} className="mt-8 h-11 rounded-full bg-brand px-6 text-white shadow-none hover:bg-brand-deep">
      Download Receipt
    </Button>
  )
}
