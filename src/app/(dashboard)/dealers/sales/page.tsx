'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getAllDealerSales, type DealerSalesRanking } from '@/lib/api/productMix'
import { ArrowLeft, TrendingUp } from 'lucide-react'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

// Get repId from session - this would normally come from auth context
async function getRepId(): Promise<string | null> {
  const response = await fetch('/api/auth/session')
  if (!response.ok) return null
  const data = await response.json()
  return data.repId || null
}

export default function DealerSalesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  // Read year from URL or default to current year
  const urlYear = searchParams.get('year')
  const [year, setYear] = useState(urlYear ? parseInt(urlYear, 10) : currentYear)

  // Get repId from auth
  const { data: repId } = useQuery({
    queryKey: ['repId'],
    queryFn: getRepId,
    staleTime: Infinity
  })

  // Fetch dealer sales data
  const { data: dealers = [], isLoading, error } = useQuery({
    queryKey: ['dealerSales', repId, year],
    queryFn: () => getAllDealerSales(repId!, year),
    enabled: !!repId
  })

  // Update URL when year changes
  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    const params = new URLSearchParams(searchParams.toString())
    if (newYear === currentYear) {
      params.delete('year')
    } else {
      params.set('year', newYear.toString())
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // Calculate totals
  const totalSales = dealers.reduce((sum, d) => sum + d.total_sales, 0)
  const totalOrders = dealers.reduce((sum, d) => sum + d.total_orders, 0)

  // Build year suffix for links
  const yearSuffix = year !== currentYear ? `?year=${year}` : ''

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-red-600">Failed to load dealer sales data.</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/${year !== currentYear ? `?year=${year}` : ''}`}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              Dealer Sales Ranking
            </h1>
            <p className="text-sm text-gray-500">
              All dealers sorted by YTD sales for {year}
            </p>
          </div>
        </div>
        <select
          value={year}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalSales)}</p>
          <p className="text-xs text-gray-500">Total Sales</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{formatNumber(totalOrders)}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{dealers.length}</p>
          <p className="text-xs text-gray-500">Active Dealers</p>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-2">
        {dealers.map((dealer, index) => (
          <Link key={dealer.id} href={`/dealers/${dealer.id}${yearSuffix}`}>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100 active:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-indigo-600">{dealer.dealer_name}</p>
                    <p className="text-xs text-gray-500">{dealer.account_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(dealer.total_sales)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(dealer.total_orders)} orders</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {dealers.length === 0 && (
          <p className="text-center text-gray-500 py-8">No sales data for {year}</p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dealer</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-indigo-600">Adura</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-green-600">Wood/Lam</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-amber-600">Sundries</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-red-600">NS/Resp</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-purple-600">Sheet</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dealers.map((dealer, index) => (
              <tr key={dealer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-400">
                  {index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/dealers/${dealer.id}${yearSuffix}`} className="block">
                    <div className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                      {dealer.dealer_name}
                    </div>
                    <div className="text-xs text-gray-500">{dealer.account_number}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(dealer.total_sales)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                  {formatNumber(dealer.total_orders)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-indigo-600">
                  {formatCurrency(dealer.adura_sales)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-green-600">
                  {formatCurrency(dealer.wood_laminate_sales)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-amber-600">
                  {formatCurrency(dealer.sundries_sales)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-red-600">
                  {formatCurrency(dealer.ns_resp_sales)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-purple-600">
                  {formatCurrency(dealer.sheet_sales)}
                </td>
              </tr>
            ))}
            {dealers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                  No sales data for {year}. Upload monthly sales data to see rankings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
