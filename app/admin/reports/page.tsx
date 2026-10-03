'use client'

import { useState } from 'react'
import { PageIntro, Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'

const presets = ['Today', 'This week', 'This month', 'This year', 'Custom']
const reports = [
  ['Donations', 'Gifts, methods and statuses for the selected period.'],
  ['Campaigns', 'Targets, progress and donor counts.'],
  ['Expenses', 'Allocations recorded against campaigns.'],
  ['Beneficiaries', 'Learners, levels and sponsorship progress.'],
  ['Impact', 'Children supported, schools and completed campaigns.'],
  ['Donors', 'Named donors and contact details.'],
]

export default function Page() {
  const [preset, setPreset] = useState('This month')
  const [message, setMessage] = useState('')
  return (
    <div>
      <PageIntro title="Reports" description="Choose a period, then prepare an export. Files are generated once a reports API is connected." />
      <div className="mt-6 flex flex-wrap gap-2">
        {presets.map((item) => (
          <button key={item} type="button" onClick={() => setPreset(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${preset === item ? 'bg-forest text-white shadow-sm' : 'border border-line bg-white text-ink hover:bg-mist'}`}>{item}</button>
        ))}
      </div>
      {preset === 'Custom' && <p className="mt-3 text-sm text-sage">Custom dates will be sent with the export when the reports API is connected.</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {reports.map(([report, detail]) => (
          <Panel key={report} title={report} description={detail} padded>
            <div className="flex flex-wrap gap-2">
              {[['CSV', 'Export CSV'], ['Excel', 'Export Excel'], ['PDF', 'Generate PDF']].map(([kind, label]) => (
                <Button key={kind} variant="outline" className="rounded-full" onClick={() => setMessage(`${report} ${kind} export for ${preset.toLowerCase()} is prepared for the reports API.`)}>{label}</Button>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      {message && <p className="mt-4 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-forest shadow-sm" role="status">{message}</p>}
    </div>
  )
}
