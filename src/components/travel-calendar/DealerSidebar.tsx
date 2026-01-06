'use client'

import { useState, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Search, Building2, GripVertical, X, ChevronRight } from 'lucide-react'
import type { Dealer } from '@/types'

interface DealerSidebarProps {
  dealers: Dealer[]
  scheduledDealerIds: Set<string>
  isOpen: boolean
  onToggle: () => void
}

interface DraggableDealerProps {
  dealer: Dealer
  isScheduled: boolean
}

function DraggableDealer({ dealer, isScheduled }: DraggableDealerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `dealer-${dealer.id}`,
    data: { type: 'dealer', dealer },
    disabled: isScheduled
  })

  const style: React.CSSProperties = {
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 50
    } : {}),
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-2 rounded-lg border transition-all select-none ${
        isDragging 
          ? 'bg-blue-50 border-blue-300 shadow-lg cursor-grabbing' 
          : isScheduled
            ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="p-0.5 text-gray-400">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 pointer-events-none">
        <p className="text-sm font-medium text-gray-900 truncate">
          {dealer.dealer_name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {dealer.account_number}
        </p>
      </div>
      {isScheduled && (
        <span className="text-xs text-gray-400 pointer-events-none">Scheduled</span>
      )}
    </div>
  )
}

export function DealerSidebar({ dealers, scheduledDealerIds, isOpen, onToggle }: DealerSidebarProps) {
  const [search, setSearch] = useState('')

  const filteredDealers = useMemo(() => {
    if (!search) return dealers
    const lower = search.toLowerCase()
    return dealers.filter(d => 
      d.dealer_name.toLowerCase().includes(lower) ||
      d.account_number.toLowerCase().includes(lower)
    )
  }, [dealers, search])

  // Collapsed state - just show toggle button
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="hidden sm:flex items-center justify-center w-10 bg-gray-50 border-l border-gray-200 hover:bg-gray-100 transition-colors"
        title="Show dealer list for drag & drop"
      >
        <ChevronRight className="h-5 w-5 text-gray-400 rotate-180" />
      </button>
    )
  }

  return (
    <div className="hidden sm:flex w-72 bg-gray-50 border-l border-gray-200 flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            Drag & Drop
          </h2>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Hide sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
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
