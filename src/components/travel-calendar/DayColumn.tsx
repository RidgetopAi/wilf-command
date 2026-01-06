'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { format, isToday, isSameDay } from 'date-fns'
import { Plus } from 'lucide-react'
import { TerritorySelector } from './TerritorySelector'
import { StopCard } from './StopCard'
import type { TravelDay, TravelStop, Territory, TravelStopStatus } from '@/types'

interface DayColumnProps {
  date: Date
  travelDay: TravelDay | null
  territories: Territory[]
  onTerritoryChange: (date: Date, territoryId: string | null) => void
  onCreateTerritory: (name: string) => Promise<void>
  onStopStatusChange: (stopId: string, status: TravelStopStatus) => void
  onStopTimeChange: (stopId: string, time: string) => void
  onStopDelete: (stopId: string) => void
  onStopAddNote: (stop: TravelStop) => void
}

export function DayColumn({
  date,
  travelDay,
  territories,
  onTerritoryChange,
  onCreateTerritory,
  onStopStatusChange,
  onStopTimeChange,
  onStopDelete,
  onStopAddNote
}: DayColumnProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const today = isToday(date)
  const stops = travelDay?.stops || []

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
    data: { type: 'day', date: dateStr }
  })

  return (
    <div
      className={`flex-1 min-w-[200px] border-r border-gray-200 last:border-r-0 flex flex-col ${
        today ? 'bg-blue-50/50' : ''
      }`}
    >
      {/* Day header */}
      <div className={`p-3 border-b border-gray-200 ${today ? 'bg-blue-100/50' : 'bg-gray-50'}`}>
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

      {/* Stops area - droppable */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 min-h-[200px] transition-colors ${
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

        {stops.length === 0 && !isOver && (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400">
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">Drop dealers here</span>
          </div>
        )}
      </div>
    </div>
  )
}
