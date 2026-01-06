'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Clock, GripVertical, MoreVertical, FileText, Check, X, RotateCcw,
  Store, Users, Calendar, Car, User, Ban, MapPin, ChevronDown, ChevronUp,
  Building2, Hash, ExternalLink
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import type { TravelStop, TravelStopStatus, TravelEventType } from '@/types'

interface StopCardProps {
  stop: TravelStop
  onStatusChange: (status: TravelStopStatus) => void
  onTimeChange: (time: string) => void
  onDelete: () => void
  onAddNote: () => void
}

const STATUS_CONFIG: Record<TravelStopStatus, { label: string; className: string }> = {
  planned: { label: 'Planned', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Done', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  rescheduled: { label: 'Moved', className: 'bg-amber-100 text-amber-800' }
}

const EVENT_ICONS: Record<TravelEventType, React.ComponentType<{ className?: string }>> = {
  dealer_visit: Store,
  meeting: Users,
  event: Calendar,
  travel: Car,
  personal: User,
  blocked: Ban
}

const EVENT_COLORS: Record<TravelEventType, string> = {
  dealer_visit: 'border-l-blue-500',
  meeting: 'border-l-purple-500',
  event: 'border-l-green-500',
  travel: 'border-l-orange-500',
  personal: 'border-l-gray-400',
  blocked: 'border-l-red-500'
}

export function StopCard({ stop, onStatusChange, onTimeChange, onDelete, onAddNote }: StopCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [timeValue, setTimeValue] = useState(stop.scheduled_time || '')
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleTimeSubmit = () => {
    onTimeChange(timeValue)
    setIsEditingTime(false)
  }

  const statusConfig = STATUS_CONFIG[stop.status]
  const isEvent = !stop.dealer_id
  const eventType = stop.event_type || 'dealer_visit'
  const EventIcon = EVENT_ICONS[eventType]
  const borderColor = EVENT_COLORS[eventType]

  // Title: dealer name or event title
  const title = isEvent ? stop.event_title : stop.dealer?.dealer_name || 'Unknown Dealer'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 border-l-4 ${borderColor} rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      } ${stop.is_all_day ? 'bg-gray-50' : ''} ${isExpanded ? 'ring-1 ring-blue-200' : ''}`}
    >
      <div
        className="flex items-start gap-2 cursor-pointer"
        onClick={(e) => {
          // Don't toggle if clicking on interactive elements
          if ((e.target as HTMLElement).closest('button, input, a')) return
          setIsExpanded(!isExpanded)
        }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-0.5"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <EventIcon className="h-4 w-4 text-gray-400 shrink-0" />
              <h4 className="font-medium text-gray-900 truncate text-sm">
                {title}
              </h4>
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                    <button
                      onClick={() => { onAddNote(); setShowMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      {stop.note_id ? 'View Note' : 'Add Note'}
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { onStatusChange('completed'); setShowMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                    >
                      <Check className="h-4 w-4" />
                      Mark Done
                    </button>
                    <button
                      onClick={() => { onStatusChange('cancelled'); setShowMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      onClick={() => { onStatusChange('rescheduled'); setShowMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-amber-600"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reschedule
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { onDelete(); setShowMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location for events */}
          {isEvent && stop.location && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="h-3 w-3" />
              {stop.location}
            </p>
          )}

          {/* Time and status row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {stop.is_all_day ? (
              <span className="text-xs text-gray-500 font-medium">All day</span>
            ) : isEditingTime ? (
              <input
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                onBlur={handleTimeSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTimeSubmit()}
                className="text-xs px-1.5 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingTime(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Clock className="h-3 w-3" />
                {stop.scheduled_time 
                  ? new Date(`2000-01-01T${stop.scheduled_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  : 'Set time'}
                {stop.end_time && (
                  <span>- {new Date(`2000-01-01T${stop.end_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                )}
              </button>
            )}

            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${statusConfig.className}`}>
              {statusConfig.label}
            </span>

            {stop.note_id && (
              <span title="Has note">
                <FileText className="h-3 w-3 text-blue-500" />
              </span>
            )}

            {/* Expand indicator */}
            <span className="ml-auto text-gray-400">
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
          {/* Dealer-specific details */}
          {!isEvent && stop.dealer && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {stop.dealer.account_number}
                </span>
                {stop.dealer.location_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {stop.dealer.location_count} location{stop.dealer.location_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {stop.dealer.buying_group && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Group:</span> {stop.dealer.buying_group}
                </p>
              )}
              <Link
                href={`/dealers/${stop.dealer.id}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                View dealer details
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Event-specific details */}
          {isEvent && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 capitalize">
                <span className="font-medium">Type:</span> {eventType.replace('_', ' ')}
              </p>
              {stop.location && (
                <p className="text-xs text-gray-600 flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{stop.location}</span>
                </p>
              )}
              {stop.duration_minutes > 0 && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Duration:</span> {stop.duration_minutes} min
                </p>
              )}
            </div>
          )}

          {/* Note preview for both */}
          {stop.note && (
            <div className="bg-gray-50 rounded p-2 space-y-1.5">
              <p className="text-xs text-gray-600 line-clamp-2">
                {stop.note.body}
              </p>
              <Link
                href={`/notes?noteId=${stop.note.id}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                <FileText className="h-3 w-3" />
                View full note
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
