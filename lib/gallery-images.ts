import { createAdminClient } from '@/lib/supabase/admin'

type PhotoRow = { id: string; src: string; campaign_id: string | null; story_id: string | null }

export function galleryObjectName(src: string) {
  if (!src.startsWith('/media/gallery/')) return ''
  const name = src.slice('/media/gallery/'.length).split('?')[0]
  return /^[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(name) ? name : ''
}

export async function removeGalleryObject(src: string) {
  const name = galleryObjectName(src)
  if (!name) return
  const { error } = await createAdminClient().storage.from('gallery').remove([name])
  if (error) throw new Error(`Could not remove gallery image: ${error.message}`)
}

export async function galleryPhoto(itemId: string) {
  const { data, error } = await createAdminClient().from('gallery')
    .select('id, src, campaign_id, story_id')
    .eq('id', itemId)
    .maybeSingle()
  if (error) throw new Error(`Could not load gallery photo: ${error.message}`)
  return data as PhotoRow | null
}

export async function photoUses(photo: { src: string; campaign_id?: string | null; story_id?: string | null }) {
  const src = photo.src
  if (!src) return []
  const db = createAdminClient()
  const [
    { data: campaigns, error: campaignsError },
    { data: stories, error: storiesError },
    { data: learners, error: learnersError },
    { data: articles, error: articlesError },
    { data: events, error: eventsError },
    { data: partners, error: partnersError },
    { data: settings, error: settingsError },
  ] = await Promise.all([
    db.from('campaigns').select('id, title, image, gallery, updates'),
    db.from('stories').select('id, title, image, gallery'),
    db.from('beneficiaries').select('display_name, image'),
    db.from('news').select('title, image'),
    db.from('events').select('name, image'),
    db.from('partners').select('name, logo_url'),
    db.from('settings').select('key, value'),
  ])
  if (campaignsError) throw new Error(`Could not check campaign photo usage: ${campaignsError.message}`)
  if (storiesError) throw new Error(`Could not check story photo usage: ${storiesError.message}`)
  if (learnersError) throw new Error(`Could not check learner photo usage: ${learnersError.message}`)
  if (articlesError) throw new Error(`Could not check news photo usage: ${articlesError.message}`)
  if (eventsError) throw new Error(`Could not check event photo usage: ${eventsError.message}`)
  if (partnersError) throw new Error(`Could not check partner photo usage: ${partnersError.message}`)
  if (settingsError) throw new Error(`Could not check settings photo usage: ${settingsError.message}`)

  const uses: string[] = []
  for (const row of campaigns ?? []) {
    if (row.image === src || jsonHas(row.gallery, src) || jsonHas(row.updates, src)) uses.push(row.title || 'A campaign')
  }
  for (const row of stories ?? []) {
    if (row.image === src || jsonHas(row.gallery, src)) uses.push(row.title || 'A story')
  }
  for (const row of learners ?? []) {
    if (row.image === src) uses.push(row.display_name || 'A learner')
  }
  for (const row of articles ?? []) {
    if (row.image === src) uses.push(row.title || 'A news article')
  }
  for (const row of events ?? []) {
    if (row.image === src) uses.push(row.name || 'An event')
  }
  for (const row of partners ?? []) {
    if (row.logo_url === src) uses.push(row.name || 'A partner')
  }
  if ((settings ?? []).some((row) => row.value === src)) uses.push('Site settings')

  if (photo.campaign_id) {
    const linked = (campaigns ?? []).find((row) => row.id === photo.campaign_id)
    const label = linked?.title || 'A campaign'
    if (!uses.includes(label)) uses.push(label)
  }
  if (photo.story_id) {
    const linked = (stories ?? []).find((row) => row.id === photo.story_id)
    const label = linked?.title || 'A story'
    if (!uses.includes(label)) uses.push(label)
  }

  return uses
}

export async function galleryUsage(items: { id: string; src: string; campaignId?: string; storyId?: string }[]) {
  const values = await Promise.all(items.map((item) => photoUses({
    src: item.src,
    campaign_id: item.campaignId ?? null,
    story_id: item.storyId ?? null,
  })))
  return Object.fromEntries(items.map((item, index) => [item.id, values[index]]))
}

export async function replacePhotoSrc(oldSrc: string, nextSrc: string) {
  if (!oldSrc || oldSrc === nextSrc) return
  const db = createAdminClient()
  const simpleUpdates = await Promise.all([
    db.from('campaigns').update({ image: nextSrc }).eq('image', oldSrc),
    db.from('stories').update({ image: nextSrc }).eq('image', oldSrc),
    db.from('beneficiaries').update({ image: nextSrc }).eq('image', oldSrc),
    db.from('news').update({ image: nextSrc }).eq('image', oldSrc),
    db.from('events').update({ image: nextSrc }).eq('image', oldSrc),
    db.from('partners').update({ logo_url: nextSrc }).eq('logo_url', oldSrc),
    db.from('settings').update({ value: nextSrc }).eq('value', oldSrc),
  ])
  for (const { error } of simpleUpdates) {
    if (error) throw new Error(`Could not replace photo reference: ${error.message}`)
  }
  await Promise.all([
    swapJson('campaigns', 'gallery', oldSrc, nextSrc),
    swapJson('campaigns', 'updates', oldSrc, nextSrc),
    swapJson('stories', 'gallery', oldSrc, nextSrc),
  ])
}

async function swapJson(table: 'campaigns' | 'stories', column: 'gallery' | 'updates', from: string, to: string) {
  const db = createAdminClient()
  const { data, error } = await db.from(table).select(`id, ${column}`)
  if (error) throw new Error(`Could not check ${table} photo references: ${error.message}`)
  const changed = (data ?? []).flatMap((row) => {
    const value = (row as Record<string, unknown>)[column]
    const next = replaceJsonString(value, from, to)
    return next === null ? [] : [{ id: row.id, [column]: next } as Record<string, unknown>]
  })
  if (!changed.length) return
  const { error: updateError } = await db.from(table).upsert(changed, { onConflict: 'id' })
  if (updateError) throw new Error(`Could not replace ${table} photo references: ${updateError.message}`)
}

function replaceJsonString(value: unknown, from: string, to: string) {
  if (!value || typeof value !== 'object') return null
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
  const next = walk(value)
  return changed ? next : null
}

function jsonHas(value: unknown, src: string): boolean {
  if (typeof value === 'string') return value === src
  if (Array.isArray(value)) return value.some((item) => jsonHas(item, src))
  if (value && typeof value === 'object') return Object.values(value).some((item) => jsonHas(item, src))
  return false
}
