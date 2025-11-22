'use client'

import { useState, useEffect } from 'react'
import { ProductMixMonthly, ProductMixTarget } from '@/types'
import { getProductMix, getTargets } from '@/lib/api/productMix'
import { ProductMixGrid } from './ProductMixGrid'
import { ProductMixChart } from './ProductMixChart'

interface ProductMixDashboardProps {
  repId: string
  accountNumber: string
}

export function ProductMixDashboard({ repId, accountNumber }: ProductMixDashboardProps) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ProductMixMonthly[]>([])
  const [target, setTarget] = useState<ProductMixTarget | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [mixData, targetData] = await Promise.all([
          getProductMix(repId, accountNumber, year),
          getTargets(repId, year)
        ])
        setData(mixData)
        setTarget(targetData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [repId, accountNumber, year])

  if (loading) return <div>Loading analytics...</div>

  const defaultTargets = {
    adura_target: target?.adura_target || 0,
    wood_laminate_target: target?.wood_laminate_target || 0,
    sundries_target: target?.sundries_target || 0,
    ns_resp_target: target?.ns_resp_target || 0,
    sheet_target: target?.sheet_target || 0,
  }

  // Transform monthly data array to object map for Grid
  const monthlyDataMap: Record<number, any> = {}
  data.forEach(row => {
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

      <div className="h-80 w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Mix Trend</h3>
        <ProductMixChart data={data} />
      </div>
    </div>
  )
}
