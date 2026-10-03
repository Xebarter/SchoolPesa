export function formatUGX(amount: number) {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    const label = Number.isInteger(millions) ? String(millions) : millions.toFixed(2).replace(/0$/, '').replace(/\.$/, '')
    return `UGX ${label}M`
  }
  return `UGX ${amount.toLocaleString('en-UG')}`
}

export function percentOf(raised: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((raised / target) * 100))
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
}
