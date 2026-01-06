'use client'

import { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { format, isToday } from 'date-fns'
import { Plus, Store, Calendar } from 'lucide-react'
import { TerritorySelector } from './TerritorySelector'
import { StopCard } from './StopCard'
import { DealerSearchPopover } from './DealerSearchPopover'
import { DealerSearchSheet } from './DealerSearchSheet'
import { EventForm } from './EventForm'
import type { TravelDay, TravelStop, Territory, TravelStopStatus, Dealer, TravelEventType } from '@/types'

interface DayColumnProps {
  date: Date
  travelDay: TravelDay | null
  territories: Territory[]
  dealers: Dealer[]
  scheduledDealerIds: Set<string>
  onTerritoryChange: (date: Date, territoryId: string | null) => void
  onCreateTerritory: (name: string) => Promise<void>
  onAddDealer: (date: Date, dealerId: string) => void
  onAddEvent: (date: Date, event: {
    event_title: string
    event_type: TravelEventType
    is_all_day: boolean
    scheduled_time?: string
    end_time?: string
    location?: string
  }) => void
  onStopStatusChange: (stopId: string, status: TravelStopStatus) => void
  onStopTimeChange: (stopId: string, time: string) => void
  onStopDelete: (stopId: string) => void
  onStopAddNote: (stop: TravelStop) => void
  enableDragDrop?: boolean
}

export function DayColumn({
  date,
  travelDay,
  territories,
  dealers,
  scheduledDealerIds,
  onTerritoryChange,
  onCreateTerritory,
  onAddDealer,
  onAddEvent,
  onStopStatusChange,
  onStopTimeChange,
  onStopDelete,
  onStopAddNote,
  enableDragDrop = false
}: DayColumnProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const today = isToday(date)
  const stops = travelDay?.stops || []
  
  const [showDealerSearch, setShowDealerSearch] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
    data: { type: 'day', date: dateStr },
    disabled: !enableDragDrop
  })

  const handleAddDealer = (dealerId: string) => {
    onAddDealer(date, dealerId)
  }

  const handleAddEvent = (event: {
    event_title: string
    event_type: TravelEventType
    is_all_day: boolean
    scheduled_time?: string
    end_time?: string
    location?: string
  }) => {
    onAddEvent(date, event)
  }

  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <div
      className={`flex-1 min-w-0 border-r border-gray-200 last:border-r-0 flex flex-col ${
        today ? 'bg-blue-50/50' : ''
      }`}
    >
      {/* Day header */}
      <div className={`p-2 sm:p-3 border-b border-gray-200 ${today ? 'bg-blue-100/50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium uppercase ${today ? 'text-blue-600' : 'text-gray-500'}`}>
            {format(date, 'EEE')}
          </span>
          {today && (
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
              Today
            </span>
          )}
        </div>
        <div className={`text-lg font-semibold ${today ? 'text-blue-900' : 'text-gray-900'}`}>
          {format(date, 'd')}
        </div>
        
        {/* Territory selector */}
        <div className="mt-2">
          <TerritorySelector
            territories={territories}
            selectedId={travelDay?.territory_id || null}
            onSelect={(id) => onTerritoryChange(date, id)}
            onCreateTerritory={onCreateTerritory}
          />
        </div>
      </div>

      {/* Stops area */}
      <div
        ref={enableDragDrop ? setNodeRef : undefined}
        className={`flex-1 p-2 space-y-2 min-h-[120px] sm:min-h-[200px] transition-colors overflow-y-auto ${
          isOver ? 'bg-blue-100/50 ring-2 ring-inset ring-blue-300' : ''
        }`}
      >
        <SortableContext
          items={stops.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {stops.map(stop => (
            <StopCard
              key={stop.id}
              stop={stop}
              onStatusChange={(status) => onStopStatusChange(stop.id, status)}
              onTimeChange={(time) => onStopTimeChange(stop.id, time)}
              onDelete={() => onStopDelete(stop.id)}
              onAddNote={() => onStopAddNote(stop)}
            />
          ))}
        </SortableContext>

        {/* Add button with menu */}
        <div className="relative">
          <button
            ref={addButtonRef}
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* Add menu dropdown */}
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    setShowDealerSearch(true)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Store className="h-4 w-4 text-blue-500" />
                  Add Dealer Visit
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    setShowEventForm(true)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Add Event
                </button>
              </div>
            </>
          )}

          {/* Desktop dealer popover */}
          {showDealerSearch && !isMobile && (
            <DealerSearchPopover
              dealers={dealers}
              scheduledDealerIds={scheduledDealerIds}
              onSelect={handleAddDealer}
              onClose={() => setShowDealerSearch(false)}
              anchorRef={addButtonRef}
            />
          )}
        </div>
      </div>

      {/* Mobile dealer bottom sheet */}
      {showDealerSearch && isMobile && (
        <DealerSearchSheet
          dealers={dealers}
          scheduledDealerIds={scheduledDealerIds}
          onSelect={handleAddDealer}
          onClose={() => setShowDealerSearch(false)}
          dateLabel={format(date, 'EEE, MMM d')}
        />
      )}

      {/* Event form (works for both desktop and mobile) */}
      {showEventForm && (
        <EventForm
          dateLabel={format(date, 'EEE, MMM d')}
          onSave={handleAddEvent}
          onClose={() => setShowEventForm(false)}
        />
      )}
    </div>
  )
}
