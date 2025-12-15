'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ProductMixMonthly } from '@/types'

interface MonthlySalesChartProps {
  data: ProductMixMonthly[]
}

const formatDollars = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value}`
}

export function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const chartData = months.map((monthName, idx) => {
    const monthNum = idx + 1
    const found = data.find(d => d.month === monthNum)

    if (found) {
      return {
        name: monthName,
        Adura: found.adura_sales,
        'Wood & Lam': found.wood_laminate_sales,
        Sundries: found.sundries_sales,
        'NS & Resp': found.ns_resp_sales,
        Sheet: found.sheet_sales,
        total: found.total_sales
      }
    }

    return {
      name: monthName,
      Adura: 0,
      'Wood & Lam': 0,
      Sundries: 0,
      'NS & Resp': 0,
      Sheet: 0,
      total: 0
    }
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={formatDollars} />
        <Tooltip
          formatter={(value: number) => formatDollars(value)}
        />
        <Legend />
        <Bar dataKey="Adura" stackId="a" fill="#4f46e5" />
        <Bar dataKey="Wood & Lam" stackId="a" fill="#10b981" />
        <Bar dataKey="Sundries" stackId="a" fill="#f59e0b" />
        <Bar dataKey="NS & Resp" stackId="a" fill="#ef4444" />
        <Bar dataKey="Sheet" stackId="a" fill="#8b5cf6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
