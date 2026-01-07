'use client'

import { ProductGroupSummary } from '@/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Category display labels and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  adura: { label: 'Adura', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  wood_laminate: { label: 'Wood/Lam', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  sundries: { label: 'Sundries', color: 'text-amber-700', bg: 'bg-amber-100' },
  ns_resp: { label: 'NS/Resp', color: 'text-red-700', bg: 'bg-red-100' },
  sheet: { label: 'Sheet', color: 'text-purple-700', bg: 'bg-purple-100' },
  '': { label: 'Other', color: 'text-gray-700', bg: 'bg-gray-100' }
}

interface ProductGroupTableProps {
  data: ProductGroupSummary[]
  showCategory?: boolean
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toFixed(0)}`
}

function GrowthIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center text-green-600">
        <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
        +{value.toFixed(1)}%
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center text-red-600">
        <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
        {value.toFixed(1)}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-gray-500">
      <Minus className="h-3.5 w-3.5 mr-0.5" />
      0%
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}

export function ProductGroupTable({ data, showCategory = true }: ProductGroupTableProps) {
  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      current: acc.current + item.current_sales,
      prior: acc.prior + item.prior_sales,
      growthDollars: acc.growthDollars + item.growth_dollars
    }),
    { current: 0, prior: 0, growthDollars: 0 }
  )
  const totalGrowthPct = totals.prior > 0
    ? ((totals.current - totals.prior) / totals.prior) * 100
    : (totals.current > 0 ? 100 : 0)

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="sm:hidden space-y-2">
        {data.map((item, idx) => (
          <div
            key={item.product_group}
            className="bg-white p-3 rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {item.product_group}
                </div>
                {showCategory && (
                  <div className="mt-1">
                    <CategoryBadge category={item.category} />
                  </div>
                )}
              </div>
              <div className="text-right ml-2">
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.current_sales)}
                </div>
                <div className="text-xs">
                  <GrowthIndicator value={item.growth_pct} />
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Prior: {formatCurrency(item.prior_sales)}</span>
              <span className={item.growth_dollars >= 0 ? 'text-green-600' : 'text-red-600'}>
                {item.growth_dollars >= 0 ? '+' : ''}{formatCurrency(item.growth_dollars)}
              </span>
            </div>
          </div>
        ))}

        {/* Mobile Total */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{formatCurrency(totals.current)}</div>
              <div className="text-xs">
                <GrowthIndicator value={totalGrowthPct} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Group
              </th>
              {showCategory && (
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
              )}
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prior Year
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change $
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={item.product_group} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{item.product_group}</span>
                </td>
                {showCategory && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <CategoryBadge category={item.category} />
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.current_sales)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-600">{formatCurrency(item.prior_sales)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className={`text-sm font-medium ${item.growth_dollars >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.growth_dollars >= 0 ? '+' : ''}{formatCurrency(item.growth_dollars)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <GrowthIndicator value={item.growth_pct} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr className="font-semibold">
              <td className="px-4 py-3 text-sm text-gray-900">
                Total ({data.length} groups)
              </td>
              {showCategory && <td></td>}
              <td className="px-4 py-3 text-right text-sm text-gray-900">
                {formatCurrency(totals.current)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-600">
                {formatCurrency(totals.prior)}
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`text-sm font-medium ${totals.growthDollars >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.growthDollars >= 0 ? '+' : ''}{formatCurrency(totals.growthDollars)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <GrowthIndicator value={totalGrowthPct} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
