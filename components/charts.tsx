'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const colors = ['#1b4f78', '#8aabc2', '#e8e1d6', '#161d24']

export function DonationsArea({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <div className="h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4ddd4" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" interval="preserveStartEnd" />
          <YAxis width={36} tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
          <Tooltip />
          <Area type="monotone" dataKey="amount" stroke="#1b4f78" fill="#d5e1ea" fillOpacity={1} name="UGX millions" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CampaignBars({ data }: { data: { name: string; amount: number }[] }) {
  const height = Math.max(180, data.length * 36)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4ddd4" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
          <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11, fill: '#66727c' }} stroke="#e4ddd4" />
          <Tooltip />
          <Bar dataKey="amount" fill="#1b4f78" radius={0} name="UGX millions" barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LevelDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <div>
      <div className="mx-auto h-52 max-w-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={2}>
              {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid gap-2">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-ink">
              <span className="size-2.5 shrink-0" style={{ background: colors[index % colors.length] }} />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 font-semibold text-forest">{total ? Math.round((entry.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
