'use client'

import { Note, NOTE_TYPE_LABELS } from '@/types'
import { Calendar, Paperclip, Clock, Store } from 'lucide-react'

interface NoteCardProps {
  note: Note
  onClick?: () => void
  showDealer?: boolean
}

const TYPE_COLORS: Record<string, string> = {
  visit: 'bg-blue-100 text-blue-800',
  follow_up: 'bg-purple-100 text-purple-800',
  vp_opportunity: 'bg-amber-100 text-amber-800',
  issue: 'bg-red-100 text-red-800',
  quote: 'bg-green-100 text-green-800',
  order: 'bg-emerald-100 text-emerald-800',
  personal: 'bg-gray-100 text-gray-800'
}

export function NoteCard({ note, onClick, showDealer }: NoteCardProps) {
  const typeColor = TYPE_COLORS[note.type] || 'bg-gray-100 text-gray-800'
  const hasFollowUp = !!note.follow_up_date
  const attachmentCount = note.attachments?.length || 0

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const isOverdue = hasFollowUp && new Date(note.follow_up_date!) < new Date()

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {/* Header: Type + Dealer + Date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
            {NOTE_TYPE_LABELS[note.type]}
          </span>
          {showDealer && note.dealer && (
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Store className="w-3 h-3" />
              {note.dealer.dealer_name}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(note.visit_date)}
        </span>
      </div>

      {/* Title if exists */}
      {note.title && (
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
          {note.title}
        </h3>
      )}

      {/* Body preview */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {note.body}
      </p>

      {/* Footer: Tags, attachments, follow-up */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tags */}
          {note.tags && note.tags.slice(0, 3).map(tag => (
            <span 
              key={tag.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
            >
              {tag.color && (
                <span 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: tag.color }}
                />
              )}
              {tag.name}
            </span>
          ))}
          {note.tags && note.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{note.tags.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {/* Attachment count */}
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {attachmentCount}
            </span>
          )}

          {/* Follow-up date */}
          {hasFollowUp && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <Clock className="w-3 h-3" />
              {formatDate(note.follow_up_date!)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
