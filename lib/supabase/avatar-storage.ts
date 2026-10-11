import 'server-only'

export function avatarObjectPath(value: unknown, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || typeof value !== 'string' || !value.startsWith(`${id}/`)) return null
  const name = value.slice(id.length + 1)
  return /^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(name) ? value : null
}
