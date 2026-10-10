import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const widths = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
} as const

const tones = {
  cream: 'bg-cream text-ink',
  mist: 'bg-mist text-ink',
  forest: 'bg-sky text-white',
  deep: 'bg-sky text-white',
} as const

export function Flow({
  children,
  className,
  width = 'xl',
}: {
  children: ReactNode
  className?: string
  width?: keyof typeof widths
}) {
  return <div className={cn('mx-auto px-5 lg:px-8', widths[width], className)}>{children}</div>
}

export function Band({
  children,
  className,
  tone = 'cream',
}: {
  children: ReactNode
  className?: string
  tone?: keyof typeof tones
}) {
  return <section className={cn(tones[tone], className)}>{children}</section>
}

export function Bridge({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('relative z-10 -mt-12 lg:-mt-16', className)}>{children}</div>
}

export function chipClass(active: boolean) {
  return cn(
    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    active ? 'bg-forest text-white' : 'bg-mist text-sage hover:bg-forest hover:text-white',
  )
}
