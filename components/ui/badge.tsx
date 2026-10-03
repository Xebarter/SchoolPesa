import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('inline-flex items-center rounded-full bg-mist px-3 py-1 text-xs font-semibold text-forest', className)} {...props} />
}
