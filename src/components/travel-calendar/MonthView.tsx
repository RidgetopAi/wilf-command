'use client'

import { useMemo } from 'react'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isToday,
  isSameDay
} from 'date-fns'
import type { TravelDay, TravelStop } from '@/types'

interface MonthViewProps {
  currentDate: Date
  travelDays: TravelDay[]
  onDayClick: (date: Date) => void
}

export function MonthView({ currentDate, travelDays, onDayClick }: MonthViewProps) {
  // Get all days to display (including partial weeks at start/end)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentDate])

  // Map travel days by date string
  const travelDaysByDate = useMemo(() => {
    const map = new Map<string, TravelDay>()
    travelDays.forEach(day => {
      map.set(day.date, day)
    })
    return map
  }, [travelDays])

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: Date[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="flex-1 flex flex-col overflow-hidden border border-gray-200 rounded-lg bg-white">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDayNames.map(day => (
          <div 
            key={day} 
            className={`py-2 text-center text-xs font-medium uppercase ${
              day === 'Sat' || day === 'Sun' ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex-1 grid grid-cols-7 border-b border-gray-100 last:border-b-0 min-h-0">
            {week.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const travelDay = travelDaysByDate.get(dateStr)
              const isCurrentMonth = isSameMonth(date, currentDate)
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const today = isToday(date)
              const stops = travelDay?.stops || []
              const dealerStops = stops.filter(s => s.dealer_id)
              const eventStops = stops.filter(s => !s.dealer_id)

              return (
                <button
                  key={dateStr}
                  onClick={() => onDayClick(date)}
                  className={`min-h-[80px] p-1 text-left border-r border-gray-100 last:border-r-0 transition-colors hover:bg-blue-50 ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isWeekend ? 'bg-gray-50/50' : ''} ${today ? 'bg-blue-50/50' : ''}`}
                >
                  {/* Date number */}
                  <div className={`text-sm font-medium mb-1 ${
                    today 
                      ? 'text-white bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center' 
                      : isCurrentMonth 
                        ? 'text-gray-900' 
                        : 'text-gray-400'
                  }`}>
                    {format(date, 'd')}
                  </div>

                  {/* Territory indicator */}
                  {travelDay?.territory && (
                    <div 
                      className="text-[10px] font-medium px-1 py-0.5 rounded truncate mb-1"
                      style={{ 
                        backgroundColor: `${travelDay.territory.color}20`,
                        color: travelDay.territory.color 
                      }}
                    >
                      {travelDay.territory.name}
                    </div>
                  )}

                  {/* Stop indicators - show actual names */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dealerStops.slice(0, 3).map((stop, idx) => (
                      <div
                        key={stop.id || idx}
                        className="text-[10px] text-blue-600 font-medium truncate leading-tight"
                        title={stop.dealer?.dealer_name || 'Unknown'}
                      >
                        {stop.dealer?.dealer_name || 'Unknown'}
                      </div>
                    ))}
                    {dealerStops.length > 3 && (
                      <div className="text-[10px] text-blue-400 font-medium">
                        +{dealerStops.length - 3} more
                      </div>
                    )}
                    {eventStops.slice(0, 2).map((stop, idx) => (
                      <div
                        key={stop.id || `evt-${idx}`}
                        className="text-[10px] text-purple-600 font-medium truncate leading-tight"
                        title={stop.event_title || 'Event'}
                      >
                        {stop.event_title || 'Event'}
                      </div>
                    ))}
                    {eventStops.length > 2 && (
                      <div className="text-[10px] text-purple-400 font-medium">
                        +{eventStops.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
