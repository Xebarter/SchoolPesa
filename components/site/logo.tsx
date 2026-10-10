import Image from 'next/image'
import Link from 'next/link'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <Image src="/web-app-manifest-192x192.png" alt="" width={36} height={36} className="size-9 rounded-xl bg-white" />
      <span className={`text-lg ${light ? 'text-white' : 'text-ink'}`}>
        School <span className={light ? 'text-white/80' : 'text-brand'}>Pesa</span>
      </span>
    </Link>
  )
}
