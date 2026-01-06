'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'

interface CalendarHeaderProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onTodayClick: () => void
}

export function CalendarHeader({ currentDate, onDateChange, onTodayClick }: CalendarHeaderProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const handlePrevWeek = () => {
    onDateChange(subWeeks(currentDate, 1))
  }

  const handleNextWeek = () => {
    onDateChange(addWeeks(currentDate, 1))
  }

  return (
    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-gray-400" />
          Travel Calendar
        </h1>
        <span className="text-lg text-gray-600">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onTodayClick}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Today
        </button>
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-gray-100 border-r border-gray-300"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
