'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, GripVertical, MoreVertical, FileText, Check, X, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { TravelStop, TravelStopStatus } from '@/types'

interface StopCardProps {
  stop: TravelStop
  onStatusChange: (status: TravelStopStatus) => void
  onTimeChange: (time: string) => void
  onDelete: () => void
  onAddNote: () => void
}

const STATUS_CONFIG: Record<TravelStopStatus, { label: string; className: string }> = {
  planned: { label: 'Planned', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  rescheduled: { label: 'Rescheduled', className: 'bg-amber-100 text-amber-800' }
}

export function StopCard({ stop, onStatusChange, onTimeChange, onDelete, onAddNote }: StopCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [timeValue, setTimeValue] = useState(stop.scheduled_time || '')

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-gray-900 truncate">
              {stop.dealer?.dealer_name || 'Unknown Dealer'}
            </h4>
            <div className="relative">
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
                      Mark Completed
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

          {/* Time and status */}
          <div className="flex items-center gap-2 mt-1.5">
            {isEditingTime ? (
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
          </div>
        </div>
      </div>
    </div>
  )
}
