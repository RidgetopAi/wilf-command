'use client'

import { useState } from 'react'
import { X, Calendar, Clock, MapPin } from 'lucide-react'
import type { TravelEventType } from '@/types'
import { EVENT_TYPE_CONFIG } from '@/types'

interface EventFormProps {
  dateLabel: string
  onSave: (event: {
    event_title: string
    event_type: TravelEventType
    is_all_day: boolean
    scheduled_time?: string
    end_time?: string
    location?: string
  }) => void
  onClose: () => void
}

export function EventForm({ dateLabel, onSave, onClose }: EventFormProps) {
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<TravelEventType>('meeting')
  const [isAllDay, setIsAllDay] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSave({
      event_title: title.trim(),
      event_type: eventType,
      is_all_day: isAllDay,
      scheduled_time: isAllDay ? undefined : startTime || undefined,
      end_time: isAllDay ? undefined : endTime || undefined,
      location: location.trim() || undefined
    })
    onClose()
  }

  // Filter out dealer_visit from event types (that's for dealer selection)
  const eventTypes = Object.entries(EVENT_TYPE_CONFIG).filter(
    ([key]) => key !== 'dealer_visit'
  ) as [TravelEventType, typeof EVENT_TYPE_CONFIG[TravelEventType]][]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Form - centered on desktop, bottom sheet on mobile */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white sm:rounded-xl rounded-t-2xl shadow-2xl w-full sm:max-w-md animate-slide-up sm:animate-none">
        {/* Handle - mobile only */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              Add Event - {dateLabel}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Meeting with boss"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                required
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEventType(key)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                      eventType === key
                        ? `bg-${config.color}-100 border-${config.color}-300 text-${config.color}-800`
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    style={eventType === key ? {
                      backgroundColor: `var(--color-${config.color}-100, #dbeafe)`,
                      borderColor: `var(--color-${config.color}-300, #93c5fd)`,
                      color: `var(--color-${config.color}-800, #1e40af)`
                    } : {}}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm text-gray-700">All day event</span>
            </div>

            {/* Time inputs - hidden if all day */}
            {!isAllDay && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Start
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="h-3 w-3 inline mr-1" />
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Richmond office"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 sm:rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Event
            </button>
          </div>
        </form>

        {/* Safe area padding */}
        <div className="h-safe-area-bottom sm:hidden" />
      </div>
    </>
  )
}
