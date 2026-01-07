'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PeriodType } from '@/types'

const PERIOD_LABELS: Record<PeriodType, string> = {
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
  ytd: 'YTD'
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const QUARTER_NAMES = ['Q1', 'Q2', 'Q3', 'Q4']

interface PeriodSelectorProps {
  periodType: PeriodType
  year: number
  month: number
  onPeriodTypeChange: (type: PeriodType) => void
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
}

export function PeriodSelector({
  periodType,
  year,
  month,
  onPeriodTypeChange,
  onYearChange,
  onMonthChange
}: PeriodSelectorProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // Get quarter from month (1-4)
  const quarter = Math.ceil(month / 3)

  // Handle quarter change
  const handleQuarterChange = (q: number) => {
    // Set month to last month of quarter
    onMonthChange(q * 3)
  }

  // Navigate year
  const handlePrevYear = () => {
    if (year > currentYear - 5) {
      onYearChange(year - 1)
    }
  }

  const handleNextYear = () => {
    if (year < currentYear) {
      onYearChange(year + 1)
    }
  }

  // Navigate month
  const handlePrevMonth = () => {
    if (month > 1) {
      onMonthChange(month - 1)
    } else if (year > currentYear - 5) {
      onYearChange(year - 1)
      onMonthChange(12)
    }
  }

  const handleNextMonth = () => {
    const maxMonth = year === currentYear ? currentMonth : 12
    if (month < maxMonth) {
      onMonthChange(month + 1)
    } else if (year < currentYear) {
      onYearChange(year + 1)
      onMonthChange(1)
    }
  }

  // Navigate quarter
  const handlePrevQuarter = () => {
    if (quarter > 1) {
      handleQuarterChange(quarter - 1)
    } else if (year > currentYear - 5) {
      onYearChange(year - 1)
      handleQuarterChange(4)
    }
  }

  const handleNextQuarter = () => {
    const currentQuarter = Math.ceil(currentMonth / 3)
    const maxQuarter = year === currentYear ? currentQuarter : 4
    if (quarter < maxQuarter) {
      handleQuarterChange(quarter + 1)
    } else if (year < currentYear) {
      onYearChange(year + 1)
      handleQuarterChange(1)
    }
  }

  // Get display label for current period
  const getPeriodLabel = (): string => {
    switch (periodType) {
      case 'month':
        return `${MONTH_NAMES[month - 1]} ${year}`
      case 'quarter':
        return `${QUARTER_NAMES[quarter - 1]} ${year}`
      case 'year':
        return `${year}`
      case 'ytd':
        return `YTD ${year} (thru ${MONTH_NAMES[month - 1]})`
      default:
        return ''
    }
  }

  // Navigation handlers based on period type
  const handlePrev = () => {
    switch (periodType) {
      case 'month':
        handlePrevMonth()
        break
      case 'quarter':
        handlePrevQuarter()
        break
      case 'year':
      case 'ytd':
        handlePrevYear()
        break
    }
  }

  const handleNext = () => {
    switch (periodType) {
      case 'month':
        handleNextMonth()
        break
      case 'quarter':
        handleNextQuarter()
        break
      case 'year':
      case 'ytd':
        handleNextYear()
        break
    }
  }

  // Check if can navigate
  const canGoPrev = year > currentYear - 5 || (periodType === 'month' && month > 1) || (periodType === 'quarter' && quarter > 1)
  const canGoNext = (() => {
    if (year < currentYear) return true
    if (year === currentYear) {
      if (periodType === 'month') return month < currentMonth
      if (periodType === 'quarter') return quarter < Math.ceil(currentMonth / 3)
      return false
    }
    return false
  })()

  return (
    <div className="space-y-3">
      {/* Period Type Pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as PeriodType[]).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => onPeriodTypeChange(type)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${periodType === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {PERIOD_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Period Navigator */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous period"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <span className="text-sm font-medium text-gray-900">
          {getPeriodLabel()}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next period"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Month Grid for Month view */}
      {periodType === 'month' && (
        <div className="grid grid-cols-6 gap-1">
          {MONTH_NAMES.map((name, idx) => {
            const monthNum = idx + 1
            const isDisabled = year === currentYear && monthNum > currentMonth
            const isSelected = month === monthNum

            return (
              <button
                key={name}
                type="button"
                onClick={() => !isDisabled && onMonthChange(monthNum)}
                disabled={isDisabled}
                className={`
                  px-2 py-1.5 text-xs font-medium rounded transition-colors
                  ${isSelected
                    ? 'bg-indigo-600 text-white'
                    : isDisabled
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }
                `}
              >
                {name}
              </button>
            )
          })}
        </div>
      )}

      {/* Quarter Grid for Quarter view */}
      {periodType === 'quarter' && (
        <div className="grid grid-cols-4 gap-2">
          {QUARTER_NAMES.map((name, idx) => {
            const qNum = idx + 1
            const currentQuarter = Math.ceil(currentMonth / 3)
            const isDisabled = year === currentYear && qNum > currentQuarter
            const isSelected = quarter === qNum

            return (
              <button
                key={name}
                type="button"
                onClick={() => !isDisabled && handleQuarterChange(qNum)}
                disabled={isDisabled}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isSelected
                    ? 'bg-indigo-600 text-white'
                    : isDisabled
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }
                `}
              >
                {name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
