import { getDb } from '@/lib/db'

type PhotoRow = { id: string; src: string; campaign_id: string | null; story_id: string | null }

export function galleryPhoto(itemId: string) {
  return getDb().prepare('SELECT id, src, campaign_id, story_id FROM gallery WHERE id = ?').get(itemId) as PhotoRow | undefined
}

export function photoUses(photo: { src: string; campaign_id?: string | null; story_id?: string | null }) {
  const db = getDb()
  const uses: string[] = []
  const src = photo.src
  if (!src) return uses

  const campaigns = db.prepare('SELECT id, title, image, gallery, updates FROM campaigns').all() as { id: string; title: string; image: string | null; gallery: string | null; updates: string | null }[]
  for (const row of campaigns) {
    if (row.image === src || jsonHas(row.gallery, src) || jsonHas(row.updates, src)) uses.push(row.title || 'A campaign')
  }

  const stories = db.prepare('SELECT title, image, gallery FROM stories').all() as { title: string; image: string | null; gallery: string | null }[]
  for (const row of stories) {
    if (row.image === src || jsonHas(row.gallery, src)) uses.push(row.title || 'A story')
  }

  const learners = db.prepare('SELECT display_name, image FROM beneficiaries').all() as { display_name: string; image: string | null }[]
  for (const row of learners) {
    if (row.image === src) uses.push(row.display_name || 'A learner')
  }

  const articles = db.prepare('SELECT title, image FROM news').all() as { title: string; image: string | null }[]
  for (const row of articles) {
    if (row.image === src) uses.push(row.title || 'A news article')
  }

  const events = db.prepare('SELECT name, image FROM events').all() as { name: string; image: string | null }[]
  for (const row of events) {
    if (row.image === src) uses.push(row.name || 'An event')
  }

  const partners = db.prepare('SELECT name, logo_url FROM partners').all() as { name: string; logo_url: string | null }[]
  for (const row of partners) {
    if (row.logo_url === src) uses.push(row.name || 'A partner')
  }

  const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  for (const row of settings) {
    if (row.value === src) uses.push('Site settings')
  }

  if (photo.campaign_id) {
    const linked = campaigns.find((row) => row.id === photo.campaign_id)
    const label = linked?.title || 'A campaign'
    if (!uses.includes(label)) uses.push(label)
  }
  if (photo.story_id) {
    const linked = db.prepare('SELECT title FROM stories WHERE id = ?').get(photo.story_id) as { title: string } | undefined
    const label = linked?.title || 'A story'
    if (!uses.includes(label)) uses.push(label)
  }

  return uses
}

export function galleryUsage(items: { id: string; src: string; campaignId?: string; storyId?: string }[]) {
  const usage: Record<string, string[]> = {}
  for (const item of items) {
    usage[item.id] = photoUses({ src: item.src, campaign_id: item.campaignId ?? null, story_id: item.storyId ?? null })
  }
  return usage
}

export function replacePhotoSrc(oldSrc: string, nextSrc: string) {
  if (!oldSrc || oldSrc === nextSrc) return
  const db = getDb()
  db.prepare('UPDATE campaigns SET image = ? WHERE image = ?').run(nextSrc, oldSrc)
  db.prepare('UPDATE stories SET image = ? WHERE image = ?').run(nextSrc, oldSrc)
  db.prepare('UPDATE beneficiaries SET image = ? WHERE image = ?').run(nextSrc, oldSrc)
  db.prepare('UPDATE news SET image = ? WHERE image = ?').run(nextSrc, oldSrc)
  db.prepare('UPDATE events SET image = ? WHERE image = ?').run(nextSrc, oldSrc)
  db.prepare('UPDATE partners SET logo_url = ? WHERE logo_url = ?').run(nextSrc, oldSrc)
  db.prepare('UPDATE settings SET value = ? WHERE value = ?').run(nextSrc, oldSrc)
  swapJson('campaigns', 'gallery', oldSrc, nextSrc)
  swapJson('campaigns', 'updates', oldSrc, nextSrc)
  swapJson('stories', 'gallery', oldSrc, nextSrc)
}

function swapJson(table: 'campaigns' | 'stories', column: 'gallery' | 'updates', from: string, to: string) {
  const db = getDb()
  const rows = db.prepare(`SELECT id, ${column} AS value FROM ${table}`).all() as { id: string; value: string | null }[]
  const update = db.prepare(`UPDATE ${table} SET ${column} = ? WHERE id = ?`)
  for (const row of rows) {
    const next = replaceJsonString(row.value, from, to)
    if (next) update.run(next, row.id)
  }
}

function replaceJsonString(value: string | null, from: string, to: string) {
  if (!value || !value.includes(from)) return null
  try {
    let changed = false
    const walk = (node: unknown): unknown => {
      if (typeof node === 'string') {
        if (node === from) {
          changed = true
          return to
        }
        return node
      }
      if (Array.isArray(node)) return node.map(walk)
      if (node && typeof node === 'object') {
        return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, walk(child)]))
      }
      return node
    }
    const next = walk(JSON.parse(value))
    return changed ? JSON.stringify(next) : null
  } catch {
    return null
  }
}

function jsonHas(value: string | null, src: string) {
  if (!value || !src || !value.includes(src)) return false
  try {
    const walk = (node: unknown): boolean => {
      if (typeof node === 'string') return node === src
      if (Array.isArray(node)) return node.some(walk)
      if (node && typeof node === 'object') return Object.values(node).some(walk)
      return false
    }
    return walk(JSON.parse(value))
  } catch {
    return false
  }
}
