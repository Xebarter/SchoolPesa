import { Check } from 'lucide-react'

export function ImageUploadProgress({ progress, success }: { progress: number | null; success?: string }) {
  if (progress === null && !success) return null

  return (
    <div
      className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-800"
      role={progress === null ? 'status' : 'progressbar'}
      aria-label={progress === null ? success : `Image upload ${progress}% complete`}
      aria-valuenow={progress ?? undefined}
      aria-valuemin={progress === null ? undefined : 0}
      aria-valuemax={progress === null ? undefined : 100}
    >
      <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-sm">
        <svg className="absolute inset-0 size-10 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-100" />
          {progress !== null ? (
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 17}
              strokeDashoffset={2 * Math.PI * 17 * (1 - progress / 100)}
              className="text-emerald-600 transition-[stroke-dashoffset] duration-200"
            />
          ) : null}
        </svg>
        {progress === null ? <Check className="relative size-4 text-emerald-700" strokeWidth={3} /> : <span className="relative text-[10px] font-bold tabular-nums">{progress}%</span>}
      </span>
      <span className="min-w-0 text-sm font-medium leading-5">
        {progress === null ? success : progress >= 95 ? 'Finishing securely…' : 'Uploading image…'}
      </span>
    </div>
  )
}
