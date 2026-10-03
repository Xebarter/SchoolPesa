'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-forest/40" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="ml-auto flex h-full w-[min(100%,22rem)] flex-col bg-cream p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close menu" className="grid size-9 place-items-center rounded-full border border-line">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
