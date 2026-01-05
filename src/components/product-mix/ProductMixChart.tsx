'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts'
import { ProductMixMonthly } from '@/types'

interface ProductMixChartProps {
  data: ProductMixMonthly[]
}

// Check if a record represents a partial month
function isPartialMonth(record: ProductMixMonthly): boolean {
  if (!record.period_start || !record.period_end) return false
  const start = new Date(record.period_start)
  const end = new Date(record.period_end)
  const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  return start.getDate() !== 1 || end.getDate() !== lastDayOfMonth
}

// Format period range for tooltip
function formatPeriod(record: ProductMixMonthly): string {
  if (!record.period_start || !record.period_end) return ''
  const start = new Date(record.period_start)
  const end = new Date(record.period_end)
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
}

export function ProductMixChart({ data }: ProductMixChartProps) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Fill in missing months with 0
  const chartData = months.map((monthName, idx) => {
    const monthNum = idx + 1
    const found = data.find(d => d.month === monthNum)

    if (found) {
      const partial = isPartialMonth(found)
      return {
        name: partial ? `${monthName}*` : monthName,
        Adura: found.adura_pct,
        'Wood & Lam': found.wood_laminate_pct,
        Sundries: found.sundries_pct,
        'NS & Resp': found.ns_resp_pct,
        Sheet: found.sheet_pct,
        isPartial: partial,
        period: formatPeriod(found)
      }
    }

    return {
      name: monthName,
      Adura: 0,
      'Wood & Lam': 0,
      Sundries: 0,
      'NS & Resp': 0,
      Sheet: 0,
      isPartial: false,
      period: ''
    }
  })

  // Check if any month is partial to show legend note
  const hasPartialMonths = chartData.some(d => d.isPartial)

  // Custom tooltip to show period info for partial months
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null
    const dataPoint = chartData.find(d => d.name === label)
    return (
      <div className="bg-white p-3 border rounded shadow-lg text-sm">
        <p className="font-semibold mb-1">
          {label}
          {dataPoint?.isPartial && dataPoint?.period && (
            <span className="ml-1 text-amber-600 font-normal">({dataPoint.period})</span>
          )}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(1)}%
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {hasPartialMonths && (
        <div className="absolute top-0 right-0 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          * Partial month data
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Adura" stackId="a" fill="#4f46e5" />
          <Bar dataKey="Wood & Lam" stackId="a" fill="#10b981" />
          <Bar dataKey="Sundries" stackId="a" fill="#f59e0b" />
          <Bar dataKey="NS & Resp" stackId="a" fill="#ef4444" />
          <Bar dataKey="Sheet" stackId="a" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
