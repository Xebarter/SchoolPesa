import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageIntro({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1.5 text-sm leading-6 text-sage">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  padded = false,
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-forest/5', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title ? <h2 className="text-sm font-semibold text-ink">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs leading-5 text-sage">{description}</p> : null}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </section>
  )
}

export function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-forest/5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-forest">{value}</p>
      {hint ? <p className="mt-1 text-xs text-sage">{hint}</p> : null}
    </div>
  )
}

const tones: Record<string, string> = {
  active: 'bg-mist text-forest',
  successful: 'bg-mist text-forest',
  published: 'bg-mist text-forest',
  approved: 'bg-mist text-forest',
  paid: 'bg-mist text-forest',
  recorded: 'bg-mist text-forest',
  completed: 'bg-[#e7f3ea] text-forest',
  accepted: 'bg-mist text-forest',
  public: 'bg-mist text-forest',
  pending: 'bg-[#fff4dc] text-[#8a5a12]',
  processing: 'bg-[#fff4dc] text-[#8a5a12]',
  draft: 'bg-[#f3f0ea] text-[#5c564c]',
  new: 'bg-[#fff4dc] text-[#8a5a12]',
  reviewing: 'bg-[#fff4dc] text-[#8a5a12]',
  paused: 'bg-[#eef1f0] text-sage',
  private: 'bg-[#eef1f0] text-sage',
  archived: 'bg-[#eef1f0] text-sage',
  cancelled: 'bg-[#f8ece8] text-[#8d4b38]',
  failed: 'bg-[#f8ece8] text-[#8d4b38]',
  refunded: 'bg-[#f8ece8] text-[#8d4b38]',
}

export function StatusPill({ value }: { value: string }) {
  const key = value.toLowerCase()
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize', tones[key] ?? 'bg-mist text-forest')}>
      {value}
    </span>
  )
}

export function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-forest/5">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export const thClass = 'whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-sage'
export const tdClass = 'px-4 py-3.5 align-middle text-sm text-ink'
export const trClass = 'border-b border-line transition-colors last:border-0 hover:bg-[#f7faf8]'
export const actionClass = 'rounded-full px-2.5 py-1 text-xs font-semibold text-forest hover:bg-mist'
