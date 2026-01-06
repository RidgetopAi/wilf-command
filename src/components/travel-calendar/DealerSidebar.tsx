'use client'

import { useState, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Search, Building2, GripVertical } from 'lucide-react'
import type { Dealer } from '@/types'

interface DealerSidebarProps {
  dealers: Dealer[]
  scheduledDealerIds: Set<string>
}

interface DraggableDealerProps {
  dealer: Dealer
  isScheduled: boolean
}

function DraggableDealer({ dealer, isScheduled }: DraggableDealerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `dealer-${dealer.id}`,
    data: { type: 'dealer', dealer }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
        isDragging 
          ? 'bg-blue-50 border-blue-300 shadow-lg' 
          : isScheduled
            ? 'bg-gray-50 border-gray-200 opacity-60'
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-grab'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 text-gray-400 hover:text-gray-600"
        disabled={isScheduled}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {dealer.dealer_name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {dealer.account_number}
        </p>
      </div>
      {isScheduled && (
        <span className="text-xs text-gray-400">Scheduled</span>
      )}
    </div>
  )
}

export function DealerSidebar({ dealers, scheduledDealerIds }: DealerSidebarProps) {
  const [search, setSearch] = useState('')

  const filteredDealers = useMemo(() => {
    if (!search) return dealers
    const lower = search.toLowerCase()
    return dealers.filter(d => 
      d.dealer_name.toLowerCase().includes(lower) ||
      d.account_number.toLowerCase().includes(lower)
    )
  }, [dealers, search])

  return (
    <div className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-gray-400" />
          Dealers
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealers..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Dealer list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredDealers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {search ? 'No dealers match your search' : 'No dealers available'}
          </p>
        ) : (
          filteredDealers.map(dealer => (
            <DraggableDealer
              key={dealer.id}
              dealer={dealer}
              isScheduled={scheduledDealerIds.has(dealer.id)}
            />
          ))
        )}
      </div>

      {/* Footer with count */}
      <div className="p-3 border-t border-gray-200 bg-white text-xs text-gray-500">
        {filteredDealers.length} dealer{filteredDealers.length !== 1 ? 's' : ''}
        {scheduledDealerIds.size > 0 && ` • ${scheduledDealerIds.size} scheduled this week`}
      </div>
    </div>
  )
}
