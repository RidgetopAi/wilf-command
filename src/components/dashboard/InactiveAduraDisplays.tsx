'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useInactiveAduraDisplays } from '@/lib/hooks'
import { DisplayTimeframe } from '@/types'

interface InactiveAduraDisplaysProps {
  repId: string
  year: number
}

const TIMEFRAME_LABELS: Record<DisplayTimeframe, string> = {
  month: 'This Month',
  ytd: 'YTD',
  rolling3: 'Rolling 3 Mo'
}

export function InactiveAduraDisplays({ repId, year }: InactiveAduraDisplaysProps) {
  const [timeframe, setTimeframe] = useState<DisplayTimeframe>('rolling3')

  const { data: inactiveDealers = [], isLoading } = useInactiveAduraDisplays(
    repId,
    year,
    timeframe
  )

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Don't show the section if no dealers have adura displays or all are active
  if (inactiveDealers.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-rose-500">
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-medium text-gray-900">
              Inactive Adura Displays
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
              {inactiveDealers.length}
            </span>
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as DisplayTimeframe)}
            className="text-xs sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="rolling3">{TIMEFRAME_LABELS.rolling3}</option>
            <option value="month">{TIMEFRAME_LABELS.month}</option>
            <option value="ytd">{TIMEFRAME_LABELS.ytd}</option>
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Dealers with Adura displays but $0 sales ({TIMEFRAME_LABELS[timeframe].toLowerCase()})
        </p>
      </div>
      <div className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
        {inactiveDealers.map((dealer) => (
          <Link
            key={dealer.id}
            href={`/dealers/${dealer.id}`}
            className="block px-4 py-2 sm:px-6 sm:py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{dealer.dealer_name}</p>
                <p className="text-xs text-gray-500">{dealer.account_number}</p>
              </div>
              <span className="text-xs text-gray-400">
                {dealer.display_count} display{dealer.display_count !== 1 ? 's' : ''}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
