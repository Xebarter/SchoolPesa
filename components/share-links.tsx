'use client'

import { useState } from 'react'

export function ShareLinks({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window === 'undefined' ? path : `${window.location.origin}${path}`
  const encoded = encodeURIComponent(url)
  const text = encodeURIComponent(title)
  const links = [
    ['WhatsApp', `https://wa.me/?text=${text}%20${encoded}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encoded}`],
    ['X', `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`],
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-forest">
          {label}
        </a>
      ))}
      <button
        type="button"
        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-forest"
        onClick={async () => {
          await navigator.clipboard.writeText(url)
          setCopied(true)
        }}
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  )
}
