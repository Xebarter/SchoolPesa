'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Download, Eye, Lock, Shield, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { signOut, signOutEverywhere, updatePassword } from '@/lib/auth-client'
import { deleteDonorAccountData, exportDonorData, resetDonorPreferences, saveDonorPreferences } from '@/lib/donor-actions'
import type { DonorPreferences, UpdateCadence } from '@/lib/donor'
import { formatDate } from '@/lib/format'
import { accountInitials } from '@/lib/supabase/account'
import { cn } from '@/lib/utils'

type SettingsAccount = {
  name: string
  email: string
  phone: string
  photo: string
  createdAt: string
  provider: string
}

const sections = [
  { id: 'account', label: 'Account', icon: UserRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'data', label: 'Your data', icon: Download },
] as const

const cadences: { value: UpdateCadence; label: string; hint: string }[] = [
  { value: 'instant', label: 'As they happen', hint: 'A notice each time a campaign or learner you support posts an update.' },
  { value: 'weekly', label: 'Weekly', hint: 'In-app notices still arrive as they happen. A weekly email summary is saved for when mail is sent.' },
  { value: 'off', label: 'Off', hint: 'Campaign and learner update notices stay off. Gift confirmations still appear.' },
]

function providerLabel(provider: string) {
  if (provider === 'google') return 'Google'
  return 'Email and password'
}

function Switch({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-forest' : 'bg-line')}
    >
      <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition', checked ? 'left-5' : 'left-0.5')} />
    </button>
  )
}

function Row({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4 first:border-t-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-sage">{detail}</p>
      </div>
      {children}
    </div>
  )
}

export function SettingsForm({ account, preferences }: { account: SettingsAccount; preferences: DonorPreferences }) {
  const router = useRouter()
  const [prefs, setPrefs] = useState(preferences)
  const [savedPrefs, setSavedPrefs] = useState(preferences)
  const [prefStatus, setPrefStatus] = useState('')
  const [prefError, setPrefError] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [securityStatus, setSecurityStatus] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [securityPending, setSecurityPending] = useState(false)
  const [dataError, setDataError] = useState('')
  const [dataStatus, setDataStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const dirty = JSON.stringify(prefs) !== JSON.stringify(savedPrefs)
  const emailSignIn = account.provider !== 'google'

  function patch(next: Partial<DonorPreferences>) {
    setPrefs((current) => ({ ...current, ...next }))
    setPrefStatus('')
    setPrefError('')
  }

  async function savePreferences() {
    setSavingPrefs(true)
    setPrefError('')
    setPrefStatus('')
    try {
      await saveDonorPreferences(prefs)
      setSavedPrefs(prefs)
      setPrefStatus('Preferences saved.')
      router.refresh()
    } catch (caught) {
      setPrefError(caught instanceof Error ? caught.message : 'Preferences could not be saved.')
    } finally {
      setSavingPrefs(false)
    }
  }

  async function restoreDefaults() {
    setSavingPrefs(true)
    setPrefError('')
    setPrefStatus('')
    try {
      await resetDonorPreferences()
      const next: DonorPreferences = {
        updateCadence: 'instant',
        receiptEmails: true,
        digest: true,
        productNews: false,
        anonymousDefault: true,
        publicRecognition: false,
      }
      setPrefs(next)
      setSavedPrefs(next)
      setPrefStatus('Preferences restored.')
      router.refresh()
    } catch (caught) {
      setPrefError(caught instanceof Error ? caught.message : 'Preferences could not be restored.')
    } finally {
      setSavingPrefs(false)
    }
  }

  async function changePassword() {
    setSecurityError('')
    setSecurityStatus('')
    if (password.length < 6) {
      setSecurityError('Use at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setSecurityError('The two passwords do not match.')
      return
    }
    setSecurityPending(true)
    try {
      await updatePassword(password)
      setPassword('')
      setConfirm('')
      setSecurityStatus('Password updated.')
    } catch (caught) {
      setSecurityError(caught instanceof Error ? caught.message : 'The password could not be updated.')
    } finally {
      setSecurityPending(false)
    }
  }

  async function leave(everywhere: boolean) {
    setSecurityError('')
    setSecurityPending(true)
    try {
      if (everywhere) await signOutEverywhere()
      else await signOut()
      router.push('/')
      router.refresh()
    } catch (caught) {
      setSecurityError(caught instanceof Error ? caught.message : 'Sign-out did not complete.')
      setSecurityPending(false)
    }
  }

  async function downloadData() {
    setDataError('')
    setDataStatus('')
    setExporting(true)
    try {
      const data = await exportDonorData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'school-pesa-data.json'
      link.click()
      URL.revokeObjectURL(url)
      setDataStatus('Your data file downloaded.')
    } catch (caught) {
      setDataError(caught instanceof Error ? caught.message : 'The export could not be prepared.')
    } finally {
      setExporting(false)
    }
  }

  async function removeData() {
    setDataError('')
    setDataStatus('')
    setDeleting(true)
    try {
      await deleteDonorAccountData(confirmEmail)
      await signOut()
      router.push('/')
      router.refresh()
    } catch (caught) {
      setDataError(caught instanceof Error ? caught.message : 'The account data could not be removed.')
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-line pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Account</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] text-ink">Settings</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-sage">How School Pesa reaches you, what stays private, and how you sign in.</p>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:gap-1" aria-label="Settings sections">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <a key={section.id} href={`#${section.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-forest lg:rounded-xl lg:border-0 lg:bg-transparent lg:px-3 lg:hover:bg-white">
                <Icon className="size-4 text-brand" />
                {section.label}
              </a>
            )
          })}
        </nav>

        <div className="grid gap-6">
          <section id="account" className="scroll-mt-24 border border-line bg-white">
            <div className="flex flex-col gap-5 border-b border-line p-5 sm:flex-row sm:items-center">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-forest text-sm font-semibold text-white">
                {account.photo ? <img src={account.photo} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : accountInitials(account.name || 'Donor')}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight text-ink">{account.name || 'Donor'}</h2>
                <p className="mt-1 text-sm text-sage">{account.email}</p>
                <p className="mt-1 text-xs text-sage">
                  {providerLabel(account.provider)}
                  {account.createdAt ? ` · Joined ${formatDate(account.createdAt)}` : ''}
                  {account.phone ? ` · ${account.phone}` : ''}
                </p>
              </div>
              <Link href="/dashboard/profile" className="inline-flex h-10 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold text-forest hover:border-forest">Edit profile</Link>
            </div>
            <div className="grid sm:grid-cols-3">
              {[
                ['Sign-in email', account.email || 'Not set'],
                ['Phone', account.phone || 'Not set'],
                ['Role', 'Donor'],
              ].map(([label, value]) => (
                <div key={label} className="border-t border-line px-5 py-4 sm:border-t-0 sm:border-r sm:last:border-r-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{label}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="notifications" className="scroll-mt-24 border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Notifications</h2>
              <p className="mt-1 text-sm leading-6 text-sage">Choose which updates reach you. Gift confirmations stay on so you can find receipts.</p>
            </div>
            <fieldset className="px-5 py-4">
              <legend className="text-sm font-semibold text-ink">Campaign and learner updates</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {cadences.map((item) => {
                  const selected = prefs.updateCadence === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => patch({ updateCadence: item.value })}
                      className={cn('border px-3 py-3 text-left', selected ? 'border-forest bg-cream' : 'border-line bg-white hover:border-forest')}
                    >
                      <span className="block text-sm font-semibold text-ink">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-sage">{item.hint}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <Row title="Receipt copies" detail="Save a preference to email a copy of each confirmed receipt. The receipt still stays in your dashboard.">
              <Switch checked={prefs.receiptEmails} label="Email receipt copies" onClick={() => patch({ receiptEmails: !prefs.receiptEmails })} />
            </Row>
            <Row title="Monthly impact summary" detail="A monthly note of what your gifts supported. Saved for email summaries.">
              <Switch checked={prefs.digest} label="Monthly impact summary" onClick={() => patch({ digest: !prefs.digest })} />
            </Row>
            <Row title="School Pesa news" detail="Occasional notes about the organization. This also updates the newsletter list.">
              <Switch checked={prefs.productNews} label="School Pesa news" onClick={() => patch({ productNews: !prefs.productNews })} />
            </Row>
          </section>

          <section id="privacy" className="scroll-mt-24 border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Privacy</h2>
              <p className="mt-1 text-sm leading-6 text-sage">Gifts are private unless you choose otherwise. You can still change anonymity on each gift.</p>
            </div>
            <Row title="Give anonymously by default" detail="New gifts on the donate page start as anonymous. Your name stays off the gift.">
              <Switch checked={prefs.anonymousDefault} label="Give anonymously by default" onClick={() => patch({ anonymousDefault: !prefs.anonymousDefault })} />
            </Row>
            <Row title="Public recognition" detail="School Pesa does not publish a supporter list today. If one is added, your name stays off it unless this is on.">
              <Switch checked={prefs.publicRecognition} label="Allow public recognition" onClick={() => patch({ publicRecognition: !prefs.publicRecognition })} />
            </Row>
            <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
              <p className="w-full text-xs text-sage">Saves notification and privacy choices together.</p>
              <Button type="button" className="rounded-full bg-forest px-5 text-white hover:bg-brand-deep" disabled={!dirty || savingPrefs} onClick={() => void savePreferences()}>
                {savingPrefs ? 'Saving…' : 'Save preferences'}
              </Button>
              <Button type="button" variant="outline" className="rounded-full" disabled={savingPrefs} onClick={() => void restoreDefaults()}>Restore defaults</Button>
              {prefStatus ? <p role="status" className="text-sm text-forest">{prefStatus}</p> : null}
              {prefError ? <p role="alert" className="text-sm text-destructive">{prefError}</p> : null}
            </div>
          </section>

          <section id="security" className="scroll-mt-24 border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-brand" />
                <h2 className="text-lg font-semibold tracking-tight text-ink">Security</h2>
              </div>
              <p className="mt-1 text-sm leading-6 text-sage">You are signed in with {providerLabel(account.provider).toLowerCase()}.</p>
            </div>
            {emailSignIn ? (
              <form
                className="grid gap-4 border-b border-line px-5 py-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  void changePassword()
                }}
              >
                <Label>New password
                  <Input className="mt-2" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
                </Label>
                <Label>Confirm password
                  <Input className="mt-2" type="password" autoComplete="new-password" minLength={6} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
                </Label>
                <div className="sm:col-span-2">
                  <Button type="submit" className="rounded-full bg-forest px-5 text-white hover:bg-brand-deep" disabled={securityPending}>Update password</Button>
                </div>
              </form>
            ) : (
              <p className="border-b border-line px-5 py-4 text-sm leading-6 text-sage">Google manages the password for this account. Sign in again with Google if you need to change it.</p>
            )}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              <Button type="button" variant="outline" className="rounded-full" disabled={securityPending} onClick={() => void leave(false)}>Sign out of this browser</Button>
              <Button type="button" variant="outline" className="rounded-full" disabled={securityPending} onClick={() => void leave(true)}>Sign out everywhere</Button>
              {securityStatus ? <p role="status" className="text-sm text-forest">{securityStatus}</p> : null}
              {securityError ? <p role="alert" className="text-sm text-destructive">{securityError}</p> : null}
            </div>
          </section>

          <section id="data" className="scroll-mt-24 border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Your data</h2>
              <p className="mt-1 text-sm leading-6 text-sage">Download a copy of the profile, preferences, gifts, and notices stored for this email.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
              <Button type="button" variant="outline" className="rounded-full" disabled={exporting} onClick={() => void downloadData()}>{exporting ? 'Preparing…' : 'Download my data'}</Button>
              {dataStatus ? <p role="status" className="text-sm text-forest">{dataStatus}</p> : null}
            </div>
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">Remove account data</h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-sage">This removes your profile, preferences, follows, updates, and notices, then signs you out. Gift and receipt records stay so the organization can keep its accounts.</p>
              <Label className="mt-4 block max-w-sm">Type {account.email} to confirm
                <Input className="mt-2" value={confirmEmail} onChange={(event) => setConfirmEmail(event.target.value)} autoComplete="off" />
              </Label>
              <Button type="button" variant="destructive" className="mt-4 rounded-full" disabled={deleting || confirmEmail.trim().toLowerCase() !== account.email.trim().toLowerCase()} onClick={() => void removeData()}>
                {deleting ? 'Removing…' : 'Remove my data'}
              </Button>
              {dataError ? <p role="alert" className="mt-3 text-sm text-destructive">{dataError}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
