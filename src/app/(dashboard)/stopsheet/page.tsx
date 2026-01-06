'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardCheck, Settings, Plus, ChevronRight } from 'lucide-react'
import { getRecentStopSheets } from './actions'
import type { StopSheet } from '@/types'

export default function StopSheetPage() {
  const [recentSheets, setRecentSheets] = useState<StopSheet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const sheets = await getRecentStopSheets(10)
      setRecentSheets(sheets)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const getCompletionPercent = (sheet: StopSheet) => {
    if (!sheet.items || sheet.items.length === 0) return 0
    const checked = sheet.items.filter(i => i.is_checked).length
    return Math.round((checked / sheet.items.length) * 100)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <ClipboardCheck className="h-6 w-6 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">StopSheet</h1>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/stopsheet/editor"
          className="flex flex-col items-center justify-center gap-2 p-6 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <Settings className="h-8 w-8 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Edit Template</span>
        </Link>

        <Link
          href="/stopsheet/new"
          className="flex flex-col items-center justify-center gap-2 p-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm font-medium">Start StopSheet</span>
        </Link>
      </div>

      {/* Recent StopSheets */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent StopSheets</h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentSheets.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No stopsheets yet</p>
            <p className="text-xs text-gray-400 mt-1">Start one to track your dealer visits</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSheets.map(sheet => {
              const percent = getCompletionPercent(sheet)
              return (
                <Link
                  key={sheet.id}
                  href={`/stopsheet/${sheet.id}`}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sheet.dealer?.dealer_name || 'Unknown Dealer'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sheet.visit_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percent === 100 ? 'bg-emerald-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{percent}%</span>
                    </div>
                    {sheet.status === 'completed' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
                        Done
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
