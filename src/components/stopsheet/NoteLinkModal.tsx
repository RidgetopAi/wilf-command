'use client'

import { useState, useEffect } from 'react'
import { X, Search, FileText, Paperclip, Check } from 'lucide-react'
import type { Note, NoteType } from '@/types'
import { NOTE_TYPE_LABELS } from '@/types'

interface NoteLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (noteId: string) => void
  notes: Note[]
  isLoading?: boolean
  typeFilter: NoteType | ''
  onTypeFilterChange: (type: NoteType | '') => void
  searchQuery: string
  onSearchChange: (query: string) => void
  title?: string
}

const NOTE_TYPE_OPTIONS: { value: NoteType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'visit', label: 'Visit' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'vp', label: 'V.P.' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'plan', label: 'Plan' },
  { value: 'issue', label: 'Issue' },
  { value: 'quote', label: 'Quote' },
  { value: 'order', label: 'Order' },
  { value: 'personal', label: 'Personal' }
]

const TYPE_COLORS: Record<string, string> = {
  visit: 'bg-blue-100 text-blue-800',
  follow_up: 'bg-purple-100 text-purple-800',
  vp: 'bg-amber-100 text-amber-800',
  opportunity: 'bg-cyan-100 text-cyan-800',
  plan: 'bg-indigo-100 text-indigo-800',
  issue: 'bg-red-100 text-red-800',
  quote: 'bg-green-100 text-green-800',
  order: 'bg-emerald-100 text-emerald-800',
  personal: 'bg-gray-100 text-gray-800',
  promotion: 'bg-orange-100 text-orange-800'
}

export function NoteLinkModal({
  isOpen,
  onClose,
  onSelect,
  notes,
  isLoading,
  typeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchChange,
  title = 'Link a Note'
}: NoteLinkModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedId(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelect = () => {
    if (selectedId) {
      onSelect(selectedId)
      onClose()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      {/* Modal */}
      <div
        className="absolute bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-t-2xl sm:rounded-xl max-h-[85vh] sm:max-h-[600px] sm:max-w-lg sm:w-full overflow-hidden flex flex-col shadow-xl">
          {/* Drag Handle (mobile) */}
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -m-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b space-y-3">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value as NoteType | '')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {NOTE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notes found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => {
                  const isSelected = selectedId === note.id
                  const attachmentCount = note.attachments?.length || 0
                  const typeColor = TYPE_COLORS[note.type] || 'bg-gray-100 text-gray-800'

                  return (
                    <button
                      key={note.id}
                      onClick={() => setSelectedId(note.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
                              {NOTE_TYPE_LABELS[note.type]}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(note.visit_date)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {note.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {note.body}
                          </p>
                          {attachmentCount > 0 && (
                            <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                              <Paperclip className="h-3 w-3" />
                              {attachmentCount} file{attachmentCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-gray-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSelect}
              disabled={!selectedId}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Link Note
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
