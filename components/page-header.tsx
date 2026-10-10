import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  text,
  tone = 'ink',
  layout = 'stack',
  className,
}: {
  eyebrow: string
  title: string
  text: string
  tone?: 'ink' | 'light'
  layout?: 'stack' | 'split'
  className?: string
}) {
  const light = tone === 'light'
  const eyebrowClass = cn('text-sm font-semibold uppercase tracking-[.16em]', light ? 'text-white/60' : 'text-brand')
  const titleClass = cn('mt-4 max-w-[12ch] text-5xl font-semibold tracking-[-.05em] leading-[0.98] sm:text-6xl', light ? 'text-white' : 'text-ink')
  const textClass = cn('max-w-sm text-lg leading-8', light ? 'text-white/70' : 'text-sage')

  if (layout === 'split') {
    return (
      <div className={cn('grid items-end gap-8 lg:grid-cols-[1.15fr_.75fr] lg:gap-16', className)}>
        <div>
          <p className={eyebrowClass}>{eyebrow}</p>
          <h1 className={titleClass}>{title}</h1>
        </div>
        <p className={cn(textClass, 'lg:pb-2')}>{text}</p>
      </div>
    )
  }

  return (
    <div className={cn('max-w-3xl', className)}>
      <p className={eyebrowClass}>{eyebrow}</p>
      <h1 className={titleClass}>{title}</h1>
      <p className={cn(textClass, 'mt-6')}>{text}</p>
    </div>
  )
}
