'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'

export type CalendarView = 'week' | 'month'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onTodayClick: () => void
}

export function CalendarHeader({ currentDate, view, onDateChange, onViewChange, onTodayClick }: CalendarHeaderProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const handlePrev = () => {
    if (view === 'week') {
      onDateChange(subWeeks(currentDate, 1))
    } else {
      onDateChange(subMonths(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === 'week') {
      onDateChange(addWeeks(currentDate, 1))
    } else {
      onDateChange(addMonths(currentDate, 1))
    }
  }

  const dateLabel = view === 'week'
    ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    : format(currentDate, 'MMMM yyyy')

  return (
    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
          <span className="hidden sm:inline">Travel Calendar</span>
          <span className="sm:hidden">Travel</span>
        </h1>
        <span className="text-sm sm:text-lg text-gray-600">
          {dateLabel}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* View switcher */}
        <div className="hidden sm:flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => onViewChange('week')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'week' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => onViewChange('month')}
            className={`px-3 py-1.5 text-sm font-medium border-l border-gray-300 transition-colors ${
              view === 'month' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
        </div>

        <button
          onClick={onTodayClick}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Today
        </button>
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-gray-100 border-r border-gray-300"
            aria-label={view === 'week' ? 'Previous week' : 'Previous month'}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100"
            aria-label={view === 'week' ? 'Next week' : 'Next month'}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
