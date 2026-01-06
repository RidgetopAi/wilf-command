'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import type { Dealer } from '@/types'

interface DealerSearchPopoverProps {
  dealers: Dealer[]
  scheduledDealerIds: Set<string>
  onSelect: (dealerId: string) => void
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
}

export function DealerSearchPopover({
  dealers,
  scheduledDealerIds,
  onSelect,
  onClose,
  anchorRef
}: DealerSearchPopoverProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, anchorRef])

  // Close on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

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
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-xl w-72 max-h-80 flex flex-col"
    >
      {/* Search input */}
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealers..."
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {filteredDealers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
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
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-b-0 ${
                  isScheduled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {dealer.dealer_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {dealer.account_number}
                  </p>
                </div>
                {isScheduled && (
                  <span className="text-xs text-gray-400 ml-2 shrink-0">Scheduled</span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
        {filteredDealers.length} dealer{filteredDealers.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
