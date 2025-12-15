'use client'

import { useState } from 'react'
import { useProductMix, useProductMixTargets } from '@/lib/hooks'
import { ProductMixGrid } from './ProductMixGrid'
import { ProductMixChart } from './ProductMixChart'
import { MonthlySalesChart } from './MonthlySalesChart'

interface ProductMixDashboardProps {
  repId: string
  accountNumber: string
}

export function ProductMixDashboard({ repId, accountNumber }: ProductMixDashboardProps) {
  const [year, setYear] = useState(new Date().getFullYear())

  const { 
    data: mixData = [], 
    isLoading: isMixLoading,
    error: mixError 
  } = useProductMix(repId, accountNumber, year)

  const { 
    data: target,
    isLoading: isTargetLoading 
  } = useProductMixTargets(repId, year)

  const isLoading = isMixLoading || isTargetLoading

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-32 ml-auto" />
        <div className="h-64 bg-gray-200 rounded" />
        <div className="h-80 bg-gray-200 rounded" />
      </div>
    )
  }

  if (mixError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Couldn't load product mix data.</p>
        <p className="text-sm text-gray-500 mt-2">Check your connection and try again.</p>
      </div>
    )
  }

  const defaultTargets = {
    adura_target: target?.adura_target || 0,
    wood_laminate_target: target?.wood_laminate_target || 0,
    sundries_target: target?.sundries_target || 0,
    ns_resp_target: target?.ns_resp_target || 0,
    sheet_target: target?.sheet_target || 0,
  }

  const monthlyDataMap: Record<number, typeof mixData[0]> = {}
  mixData.forEach(row => {
    monthlyDataMap[row.month] = row
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <select 
          value={year} 
          onChange={(e) => setYear(Number(e.target.value))}
          className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      <ProductMixGrid 
        year={year} 
        targets={defaultTargets} 
        monthlyData={monthlyDataMap} 
      />

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Mix Trend</h3>
        <div className="h-80 w-full">
          <ProductMixChart data={mixData} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Sales</h3>
        <div className="h-80 w-full">
          <MonthlySalesChart data={mixData} />
        </div>
      </div>
    </div>
  )
}
