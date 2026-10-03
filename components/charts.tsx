'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const colors = ['#e8793e', '#173b2a', '#f4b942', '#315c47']

export function DonationsArea({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="#edf1ed" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#839087" />
          <YAxis tick={{ fontSize: 12 }} stroke="#839087" />
          <Tooltip />
          <Area type="monotone" dataKey="amount" stroke="#e8793e" fill="#e8793e" fillOpacity={0.2} name="UGX millions" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CampaignBars({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#edf1ed" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#839087" />
          <YAxis tick={{ fontSize: 12 }} stroke="#839087" />
          <Tooltip />
          <Bar dataKey="amount" fill="#173b2a" radius={8} name="UGX millions" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LevelDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3}>
            {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
