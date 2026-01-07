'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react'
import { PeriodType, Dealer } from '@/types'
import { PeriodSelector, ProductGroupChart, ProductGroupTable } from '@/components/product-groups'
import { useProductGroupComparison } from '@/lib/hooks/useProductGroupSales'
import { createClient } from '@/lib/supabase/client'

interface ProductGroupsPageProps {
  params: Promise<{ id: string }>
}

export default function ProductGroupsPage({ params }: ProductGroupsPageProps) {
  const [dealerId, setDealerId] = useState<string>('')
  const [dealer, setDealer] = useState<Dealer | null>(null)
  const [isLoadingDealer, setIsLoadingDealer] = useState(true)

  // Period state
  const currentDate = new Date()
  const [periodType, setPeriodType] = useState<PeriodType>('ytd')
  const [year, setYear] = useState(currentDate.getFullYear())
  const [month, setMonth] = useState(currentDate.getMonth() + 1)

  // Load dealer info
  useEffect(() => {
    async function loadDealer() {
      const resolvedParams = await params
      setDealerId(resolvedParams.id)

      const supabase = createClient()
      const { data } = await supabase
        .from('dealers')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (data) {
        setDealer(data as Dealer)
      }
      setIsLoadingDealer(false)
    }

    loadDealer()
  }, [params])

  // Fetch product group data
  const {
    data: productGroups,
    isLoading: isLoadingData,
    error
  } = useProductGroupComparison(
    dealer?.rep_id || '',
    dealer?.account_number || '',
    year,
    periodType,
    month
  )

  const isLoading = isLoadingDealer || isLoadingData

  if (isLoadingDealer) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!dealer) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-red-600">Dealer not found</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dealers/${dealerId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dealer
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
          Product Groups
        </h1>
        <p className="text-sm text-gray-500">{dealer.dealer_name} - #{dealer.account_number}</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Period</h3>
        <PeriodSelector
          periodType={periodType}
          year={year}
          month={month}
          onPeriodTypeChange={setPeriodType}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      </div>

      {/* Loading State */}
      {isLoadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading product groups...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">Error loading data: {error.message}</p>
        </div>
      )}

      {/* No Data State */}
      {!isLoadingData && !error && productGroups && productGroups.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Data Available</h3>
          <p className="text-gray-500 text-sm">
            No product group sales data found for this period.
            Try selecting a different time range.
          </p>
        </div>
      )}

      {/* Data Display */}
      {!isLoadingData && !error && productGroups && productGroups.length > 0 && (
        <>
          {/* Chart */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Sales by Product Group (vs Prior Year)
            </h3>
            <div className="h-[300px] sm:h-[400px]">
              <ProductGroupChart data={productGroups} maxItems={10} />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Detailed Comparison
            </h3>
            <ProductGroupTable data={productGroups} showCategory={true} />
          </div>
        </>
      )}
    </div>
  )
}
