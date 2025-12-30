'use client'

import { Display, ProductMixMonthly, DisplayCategory } from '@/types'

interface DisplaySalesChartProps {
  displays: Display[]
  monthlyData: ProductMixMonthly[]
}

// Map display category to the sales field in ProductMixMonthly
const CATEGORY_TO_SALES_FIELD: Record<DisplayCategory, keyof ProductMixMonthly> = {
  adura: 'adura_sales',
  laminate: 'wood_laminate_sales',
  wood: 'wood_laminate_sales',
  somerset: 'wood_laminate_sales',
  bjelin: 'wood_laminate_sales',
  lauzon: 'wood_laminate_sales',
  ns_resp: 'ns_resp_sales',
  sheet: 'sheet_sales'
}

const CATEGORY_LABELS: Record<DisplayCategory, string> = {
  adura: 'Adura',
  laminate: 'Laminate',
  wood: 'Wood',
  somerset: 'Somerset',
  bjelin: 'Bjelin',
  lauzon: 'Lauzon',
  ns_resp: 'NS & Resp',
  sheet: 'Sheet'
}

const formatDollars = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  if (value > 0) return `$${value.toFixed(0)}`
  return '-'
}

export function DisplaySalesChart({ displays, monthlyData }: DisplaySalesChartProps) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Create a map of month -> data for quick lookup
  const dataByMonth: Record<number, ProductMixMonthly> = {}
  monthlyData.forEach(d => {
    dataByMonth[d.month] = d
  })

  // Get current month to know which months should have data
  const currentMonth = new Date().getMonth() + 1 // 1-indexed

  if (displays.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No displays assigned to this dealer.</p>
        <p className="text-sm mt-1">Add displays in the Attributes page to track productivity.</p>
      </div>
    )
  }

  // Group displays by category for cleaner display
  const displaysByCategory = displays.reduce((acc, display) => {
    if (!acc[display.category]) acc[display.category] = []
    acc[display.category].push(display)
    return acc
  }, {} as Record<DisplayCategory, Display[]>)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-700 sticky left-0 bg-white min-w-[200px]">
              Display
            </th>
            {months.map((month, idx) => (
              <th
                key={month}
                className={`text-center py-2 px-2 font-medium min-w-[60px] ${
                  idx + 1 > currentMonth ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(displaysByCategory).map(([category, categoryDisplays]) => {
            const salesField = CATEGORY_TO_SALES_FIELD[category as DisplayCategory]

            return categoryDisplays.map((display, idx) => {
              // Calculate if this display category has any sales this year
              const totalSales = monthlyData.reduce((sum, d) => {
                return sum + (Number(d[salesField]) || 0)
              }, 0)

              return (
                <tr key={display.code} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400 w-6">{display.code}</span>
                      <div>
                        <div className="font-medium text-gray-900 truncate max-w-[180px]" title={display.name}>
                          {display.name}
                        </div>
                        <div className="text-xs text-gray-500">{CATEGORY_LABELS[category as DisplayCategory]}</div>
                      </div>
                    </div>
                  </td>
                  {months.map((month, monthIdx) => {
                    const monthNum = monthIdx + 1
                    const monthData = dataByMonth[monthNum]
                    const sales = monthData ? Number(monthData[salesField]) || 0 : 0
                    const isFutureMonth = monthNum > currentMonth
                    const isInactive = !isFutureMonth && sales === 0 && monthNum <= currentMonth

                    return (
                      <td
                        key={month}
                        className={`text-center py-2 px-2 ${
                          isFutureMonth
                            ? 'bg-gray-50 text-gray-300'
                            : isInactive
                            ? 'bg-red-50 text-red-600'
                            : sales > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {isFutureMonth ? '-' : formatDollars(sales)}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded"></div>
          <span>Active (has sales)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
          <span>Inactive (no sales)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
          <span>Future month</span>
        </div>
      </div>
    </div>
  )
}
