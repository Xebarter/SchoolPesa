export function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] text-ink sm:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-sage">{text}</p>
    </div>
  )
}
