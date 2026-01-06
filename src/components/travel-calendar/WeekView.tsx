'use client'

import { useMemo } from 'react'
import { startOfWeek, addDays, format } from 'date-fns'
import { DayColumn } from './DayColumn'
import type { TravelDay, Territory, TravelStop, TravelStopStatus } from '@/types'

interface WeekViewProps {
  currentDate: Date
  travelDays: TravelDay[]
  territories: Territory[]
  onTerritoryChange: (date: Date, territoryId: string | null) => void
  onCreateTerritory: (name: string) => Promise<void>
  onStopStatusChange: (stopId: string, status: TravelStopStatus) => void
  onStopTimeChange: (stopId: string, time: string) => void
  onStopDelete: (stopId: string) => void
  onStopAddNote: (stop: TravelStop) => void
}

export function WeekView({
  currentDate,
  travelDays,
  territories,
  onTerritoryChange,
  onCreateTerritory,
  onStopStatusChange,
  onStopTimeChange,
  onStopDelete,
  onStopAddNote
}: WeekViewProps) {
  // Get all 5 weekdays (Mon-Fri)
  const weekDays = useMemo(() => {
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 5 }, (_, i) => addDays(monday, i))
  }, [currentDate])

  // Map travel days by date string for easy lookup
  const travelDaysByDate = useMemo(() => {
    const map = new Map<string, TravelDay>()
    travelDays.forEach(day => {
      map.set(day.date, day)
    })
    return map
  }, [travelDays])

  return (
    <div className="flex-1 flex overflow-hidden border border-gray-200 rounded-lg bg-white">
      {weekDays.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return (
          <DayColumn
            key={dateStr}
            date={date}
            travelDay={travelDaysByDate.get(dateStr) || null}
            territories={territories}
            onTerritoryChange={onTerritoryChange}
            onCreateTerritory={onCreateTerritory}
            onStopStatusChange={onStopStatusChange}
            onStopTimeChange={onStopTimeChange}
            onStopDelete={onStopDelete}
            onStopAddNote={onStopAddNote}
          />
        )
      })}
    </div>
  )
}
