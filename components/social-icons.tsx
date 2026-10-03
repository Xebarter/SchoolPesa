export function SocialLinks({ light = false }: { light?: boolean }) {
  const className = light
    ? 'grid size-9 place-items-center rounded-full border border-white/15'
    : 'grid size-10 place-items-center rounded-full border border-line'
  const items = [
    ['Facebook', 'https://facebook.com', 'M14 8h-2a2 2 0 0 0-2 2v2H8v3h2v7h3v-7h2.2l.8-3H13v-1.2c0-.5.2-.8.8-.8H15V8z'],
    ['Instagram', 'https://instagram.com', 'M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zm8 2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-4 2.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5zM17 7.2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z'],
    ['LinkedIn', 'https://linkedin.com', 'M6 9H3v12h3zm.2-4.2A1.8 1.8 0 1 1 4.4 6.6a1.8 1.8 0 0 1 1.8-1.8zM21 21h-3v-6.2c0-1.8-.8-2.4-1.8-2.4s-2 .9-2 2.5V21h-3V9h3v1.6c.6-.9 1.8-1.8 3.6-1.8 2.4 0 4.2 1.6 4.2 4.8z'],
  ]
  return (
    <div className="flex gap-3">
      {items.map(([label, href, path]) => (
        <a key={label} href={href} aria-label={label} className={className}>
          <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true"><path d={path} /></svg>
        </a>
      ))}
    </div>
  )
}
