'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts'
import { ProductGroupSummary } from '@/types'

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  adura: '#4f46e5',        // Indigo
  wood_laminate: '#10b981', // Emerald
  sundries: '#f59e0b',      // Amber
  ns_resp: '#ef4444',       // Red
  sheet: '#8b5cf6',         // Purple
  '': '#6b7280'             // Gray fallback
}

interface ProductGroupChartProps {
  data: ProductGroupSummary[]
  maxItems?: number
}

// Format currency for display
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

// Truncate long product group names
function truncateName(name: string, maxLength: number = 20): string {
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength - 3) + '...'
}

export function ProductGroupChart({ data, maxItems = 10 }: ProductGroupChartProps) {
  // Sort by current sales and take top items
  const chartData = data
    .slice(0, maxItems)
    .map(item => ({
      name: truncateName(item.product_group),
      fullName: item.product_group,
      current: item.current_sales,
      prior: item.prior_sales,
      growth: item.growth_pct,
      growthDollars: item.growth_dollars,
      category: item.category
    }))
    .reverse() // Reverse for horizontal bar (top item at top)

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload
  }: {
    active?: boolean
    payload?: Array<{
      payload: {
        fullName: string
        current: number
        prior: number
        growth: number
        growthDollars: number
        category: string
      }
    }>
  }) => {
    if (!active || !payload || !payload.length) return null
    const d = payload[0].payload
    const isPositive = d.growth >= 0

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg text-sm max-w-xs">
        <p className="font-semibold text-gray-900 mb-2">{d.fullName}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Current:</span>
            <span className="font-medium">{formatCurrency(d.current)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Prior Year:</span>
            <span className="font-medium">{formatCurrency(d.prior)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t">
            <span className="text-gray-600">Change:</span>
            <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{d.growth.toFixed(1)}% ({isPositive ? '+' : ''}{formatCurrency(d.growthDollars)})
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Calculate domain for X axis
  const maxValue = Math.max(
    ...chartData.flatMap(d => [d.current, d.prior])
  )
  const xDomain = [0, Math.ceil(maxValue * 1.1)]

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          barGap={2}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={xDomain}
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={95}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
          <Bar
            dataKey="current"
            name="Current Year"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-current-${index}`}
                fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['']}
              />
            ))}
          </Bar>
          <Bar
            dataKey="prior"
            name="Prior Year"
            fill="#d1d5db"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Compact version for smaller displays
export function ProductGroupChartCompact({ data, maxItems = 5 }: ProductGroupChartProps) {
  const chartData = data
    .slice(0, maxItems)
    .map(item => ({
      name: truncateName(item.product_group, 15),
      current: item.current_sales,
      growth: item.growth_pct,
      category: item.category
    }))
    .reverse()

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickFormatter={formatCurrency}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10 }}
            width={75}
          />
          <Bar
            dataKey="current"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['']}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
