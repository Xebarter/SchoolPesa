export function accountName(metadata: Record<string, unknown> | undefined, email: string | null | undefined) {
  const fullName = metadata?.full_name
  const name = metadata?.name
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim()
  if (typeof name === 'string' && name.trim()) return name.trim()
  const local = email?.split('@')[0]?.trim()
  return local || 'Donor'
}

export function accountInitials(name: string) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0] ?? '')
  return (letters.join('') || 'D').toUpperCase()
}
