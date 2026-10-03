export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-sage">{body}</p>
    </div>
  )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-28 animate-pulse rounded-2xl bg-mist" />
      <div className="h-28 animate-pulse rounded-2xl bg-mist" />
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', body = 'Please try again in a moment.' }: { title?: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center" role="alert">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-sage">{body}</p>
    </div>
  )
}

export function SampleNote({ className = 'text-sage' }: { className?: string }) {
  return <p className={`text-xs ${className}`}>Sample figures for demonstration. Live totals will come from Supabase.</p>
}
