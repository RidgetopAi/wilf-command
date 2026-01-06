'use client'

import { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { format, isToday, getDay } from 'date-fns'
import { Plus, Store, Calendar } from 'lucide-react'

// Weekday color palette for visual separation (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4)
const WEEKDAY_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },      // Monday
  { bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500' }, // Tuesday
  { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500' },     // Wednesday
  { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500' },   // Thursday
  { bg: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500' },        // Friday
]
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

  // Get weekday index (0=Mon, 1=Tue, etc.) - getDay returns 0=Sun, so we convert
  const dayOfWeek = getDay(date)
  const weekdayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert Sun=0 to Mon=0
  const dayColors = WEEKDAY_COLORS[weekdayIndex] || WEEKDAY_COLORS[0]
  
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

  const selectedTerritory = territories.find(t => t.id === travelDay?.territory_id)

  return (
    <div
      className={`flex-1 min-w-0 border-r border-gray-200 last:border-r-0 flex flex-col ${
        today ? 'ring-2 ring-inset ring-gray-400' : ''
      }`}
    >
      {/* Territory banner - shows when territory is set */}
      {selectedTerritory ? (
        <div 
          className="px-2 py-1.5 text-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{ 
            backgroundColor: selectedTerritory.color,
            color: '#fff'
          }}
          onClick={() => {
            // Find and click the territory selector to open it
            const selector = document.getElementById(`territory-selector-${dateStr}`)
            selector?.click()
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wide drop-shadow-sm">
            {selectedTerritory.name}
          </span>
        </div>
      ) : null}

      {/* Day header - colored by weekday */}
      <div className={`p-2 sm:p-3 border-b ${dayColors.border} ${dayColors.bg}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium uppercase ${dayColors.text}`}>
            {format(date, 'EEE')}
          </span>
          {today && (
            <span className={`text-xs font-medium ${dayColors.text} bg-white/60 px-1.5 py-0.5 rounded`}>
              Today
            </span>
          )}
        </div>
        <div className={`text-lg font-semibold ${dayColors.text}`}>
          {format(date, 'd')}
        </div>
        
        {/* Territory selector */}
        <div className="mt-2">
          <TerritorySelector
            id={`territory-selector-${dateStr}`}
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
        className={`flex-1 p-2 space-y-2 min-h-[250px] sm:min-h-[400px] transition-colors overflow-y-auto ${
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

          {/* Add menu dropdown - fixed positioning to escape scroll container */}
          {showAddMenu && addButtonRef.current && (() => {
            const rect = addButtonRef.current.getBoundingClientRect()
            return (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                <div
                  className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
                  style={{
                    top: rect.bottom + 4,
                    left: rect.left
                  }}
                >
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
            )
          })()}

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
