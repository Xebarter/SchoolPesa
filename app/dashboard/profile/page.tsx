'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { saveDonorProfile } from '@/lib/actions'
import { deleteDonorProfile } from '@/lib/donor-actions'
import { ImageUploadProgress } from '@/components/ui/image-upload-progress'
import { uploadWithProgress } from '@/lib/image-upload-client'
import { clearProfilePhoto } from '@/lib/profile-photo'
import { updateAccount } from '@/lib/auth-client'
import { accountInitials, accountName, accountPhoto } from '@/lib/supabase/account'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

export default function Page() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState('')
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState(false)
  const [photoNote, setPhotoNote] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()
    if (!supabase) return
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return
      setName(accountName(user.user_metadata, user.email))
      setEmail(user.email ?? '')
      setPhone(typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : '')
      setPhoto(accountPhoto(user.user_metadata))
      setReady(true)
    })
  }, [])

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setPhotoNote('')
    setUploading(true)
    try {
      const body = new FormData()
      body.set('photo', file)
      setUploadProgress(0)
      const response = await uploadWithProgress('/api/profile/photo', body, setUploadProgress)
      if (typeof response.photo !== 'string') throw new Error('The server returned an invalid photo.')
      setPhoto(response.photo)
      setUploadProgress(null)
      setPhotoNote('Photo updated.')
      router.refresh()
    } catch (caught) {
      setUploadProgress(null)
      setError(caught instanceof Error ? caught.message : 'The photo could not be saved.')
    } finally {
      setUploading(false)
    }
  }

  async function onClearPhoto() {
    setError('')
    setPhotoNote('')
    setUploading(true)
    try {
      const next = await clearProfilePhoto()
      setPhoto(next)
      setPhotoNote(next ? 'Custom photo removed. Your Google photo is showing.' : 'Photo removed.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The photo could not be removed.')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    try {
      await updateAccount({ name, phone })
      await saveDonorProfile({ name, email, phone })
      setSaved(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The profile could not be saved.')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <aside className="h-fit bg-mist p-6 text-center">
        <span className="mx-auto grid size-24 place-items-center overflow-hidden rounded-full bg-forest text-lg font-semibold text-white">
          {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" className="size-full object-cover" onError={() => setPhoto('')} /> : accountInitials(name || 'Donor')}
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">{name || 'Donor'}</h1>
        <p className="mt-1 text-sm text-sage">{email || 'Donor'}</p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void onPhoto(event)} />
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button type="button" variant="outline" className="rounded-full" disabled={!ready || uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Saving photo…' : 'Upload photo'}</Button>
          {photo.startsWith('/avatars/') || photo.startsWith('blob:') ? <button type="button" className="text-xs font-semibold text-ink" disabled={uploading} onClick={() => void onClearPhoto()}>Remove photo</button> : null}
        </div>
        <ImageUploadProgress progress={uploadProgress} success={uploadProgress === null ? photoNote : undefined} />
      </aside>
      <form className="bg-mist p-6" onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Profile</h2>
        <p className="mt-1 text-sm text-sage">These details appear on receipts and campaign updates.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Label className="sm:col-span-2">Name<Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required disabled={!ready} /></Label>
          <Label>Email<Input className="mt-2" type="email" value={email} readOnly /></Label>
          <Label>Phone<Input className="mt-2" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={!ready} /></Label>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button className="rounded-full bg-forest px-5 text-white hover:bg-brand-deep" disabled={!ready}>Save profile</Button>
          <Button type="button" variant="outline" className="rounded-full" disabled={!ready} onClick={() => { void deleteDonorProfile().then(() => setSaved(false)).catch((caught) => setError(caught instanceof Error ? caught.message : 'The profile record could not be removed.')) }}>Remove saved profile</Button>
          {saved ? <p role="status" className="text-sm text-forest">Profile saved.</p> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
      </form>
    </div>
  )
}
