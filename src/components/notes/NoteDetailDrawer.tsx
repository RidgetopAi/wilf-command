'use client'

import { Note, NOTE_TYPE_LABELS } from '@/types'
import { AttachmentPreview } from './AttachmentPreview'
import { X, Calendar, Clock, Edit2, Trash2 } from 'lucide-react'

interface NoteDetailDrawerProps {
  note: Note
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onAttachmentDelete?: (attachmentId: string) => Promise<void>
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

export function NoteDetailDrawer({ 
  note, 
  onClose, 
  onEdit, 
  onDelete,
  onAttachmentDelete 
}: NoteDetailDrawerProps) {
  const typeColor = TYPE_COLORS[note.type] || 'bg-gray-100 text-gray-800'
  const hasFollowUp = !!note.follow_up_date
  const isOverdue = hasFollowUp && new Date(note.follow_up_date!) < new Date()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const handleDelete = () => {
    if (window.confirm('Delete this note? This cannot be undone.')) {
      onDelete?.()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      {/* Drawer - slides up from bottom on mobile, centered modal on desktop */}
      <div 
        className="absolute bottom-0 left-0 right-0 sm:static sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full sm:mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white rounded-t-2xl sm:rounded-xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
          {/* Drag Handle (mobile) */}
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                {NOTE_TYPE_LABELS[note.type]}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(note.visit_date)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -m-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Title */}
            {note.title && (
              <h2 className="text-lg font-semibold text-gray-900">
                {note.title}
              </h2>
            )}

            {/* Body */}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {note.body}
              </p>
            </div>

            {/* Follow-up Date */}
            {hasFollowUp && (
              <div className={`
                flex items-center gap-2 p-3 rounded-lg border
                ${isOverdue 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-purple-50 border-purple-200 text-purple-700'
                }
              `}>
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Follow-up: {formatDate(note.follow_up_date!)}
                  {isOverdue && <span className="ml-2">(Overdue)</span>}
                </span>
              </div>
            )}

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map(tag => (
                    <span 
                      key={tag.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {tag.color && (
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {note.attachments && note.attachments.length > 0 && (
              <AttachmentPreview
                attachments={note.attachments}
                onDelete={onAttachmentDelete}
                readOnly={!onAttachmentDelete}
              />
            )}

            {/* Metadata */}
            <div className="pt-4 border-t text-xs text-gray-400">
              <p>Created: {new Date(note.created_at).toLocaleString()}</p>
              {note.updated_at !== note.created_at && (
                <p>Updated: {new Date(note.updated_at).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-3 border-t bg-gray-50 flex gap-3">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <div className="flex-1" />
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
