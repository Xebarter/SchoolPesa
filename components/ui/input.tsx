import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const fieldClass =
  'h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-sage/70 focus-visible:ring-2 focus-visible:ring-gold'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldClass, className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldClass, 'min-h-28 py-3', className)} {...props} />
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium text-ink', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(fieldClass, className)} {...props} />
}
