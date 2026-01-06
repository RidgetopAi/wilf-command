'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import type { Dealer } from '@/types'

interface DealerSearchSheetProps {
  dealers: Dealer[]
  scheduledDealerIds: Set<string>
  onSelect: (dealerId: string) => void
  onClose: () => void
  dateLabel: string
}

export function DealerSearchSheet({
  dealers,
  scheduledDealerIds,
  onSelect,
  onClose,
  dateLabel
}: DealerSearchSheetProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on open
  useEffect(() => {
    // Small delay to allow animation
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const filteredDealers = useMemo(() => {
    if (!search) return dealers
    const lower = search.toLowerCase()
    return dealers.filter(d =>
      d.dealer_name.toLowerCase().includes(lower) ||
      d.account_number.toLowerCase().includes(lower)
    )
  }, [dealers, search])

  const handleSelect = (dealerId: string) => {
    onSelect(dealerId)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Add Dealer - {dateLabel}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dealers..."
              className="w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {filteredDealers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {search ? 'No dealers found' : 'No dealers available'}
            </p>
          ) : (
            filteredDealers.map(dealer => {
              const isScheduled = scheduledDealerIds.has(dealer.id)
              return (
                <button
                  key={dealer.id}
                  onClick={() => handleSelect(dealer.id)}
                  disabled={isScheduled}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between border-b border-gray-100 ${
                    isScheduled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-base font-medium text-gray-900 truncate">
                      {dealer.dealer_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {dealer.account_number}
                    </p>
                  </div>
                  {isScheduled && (
                    <span className="text-xs text-gray-400 ml-2 shrink-0 bg-gray-100 px-2 py-1 rounded">
                      Scheduled
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-area-bottom" />
      </div>
    </>
  )
}
