'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const colors = ['#1b4f78', '#8aabc2', '#e8e1d6', '#161d24']

export function DonationsArea({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="#e4ddd4" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#66727c" />
          <YAxis tick={{ fontSize: 12 }} stroke="#66727c" />
          <Tooltip />
          <Area type="monotone" dataKey="amount" stroke="#1b4f78" fill="#d5e1ea" fillOpacity={1} name="UGX millions" />
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
          <CartesianGrid stroke="#e4ddd4" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#66727c" />
          <YAxis tick={{ fontSize: 12 }} stroke="#66727c" />
          <Tooltip />
          <Bar dataKey="amount" fill="#1b4f78" radius={8} name="UGX millions" />
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
