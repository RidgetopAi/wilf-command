'use client'

import { useState } from 'react'
import { Check, MessageSquare, ChevronDown, ChevronUp, FileText, Link2, Unlink, Paperclip } from 'lucide-react'
import type { StopSheetItem as StopSheetItemType, Note } from '@/types'
import { NOTE_TYPE_LABELS } from '@/types'

interface StopSheetItemProps {
  item: StopSheetItemType
  disabled?: boolean
  onToggle: (itemId: string, isChecked: boolean) => Promise<void>
  onUpdateNotes: (itemId: string, notes: string) => Promise<void>
  onLinkNote?: (itemId: string) => void
  onViewNote?: (note: Note) => void
  onUnlinkNote?: (itemId: string) => Promise<void>
}

export function StopSheetItem({
  item,
  disabled,
  onToggle,
  onUpdateNotes,
  onLinkNote,
  onViewNote,
  onUnlinkNote
}: StopSheetItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const hasLinkedNote = !!item.linked_note
  const attachmentCount = item.linked_note?.attachments?.length || 0

  const handleToggle = async () => {
    if (disabled) return
    await onToggle(item.id, !item.is_checked)
  }

  const handleNotesBlur = async () => {
    if (notes.trim() !== (item.notes || '').trim()) {
      setIsSavingNotes(true)
      await onUpdateNotes(item.id, notes)
      setIsSavingNotes(false)
    }
  }

  const handleUnlink = async () => {
    if (!onUnlinkNote || isUnlinking) return
    setIsUnlinking(true)
    await onUnlinkNote(item.id)
    setIsUnlinking(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
            item.is_checked
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 hover:border-emerald-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {item.is_checked && <Check className="h-4 w-4" />}
        </button>

        <span
          className={`flex-1 text-sm ${
            item.is_checked ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}
        >
          {item.label}
        </span>

        {/* Linked Note Button */}
        {hasLinkedNote && onViewNote && (
          <button
            onClick={() => onViewNote(item.linked_note!)}
            className="relative p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            title={`View: ${item.linked_note?.title || NOTE_TYPE_LABELS[item.linked_note?.type || 'visit']}`}
          >
            <FileText className="h-4 w-4" />
            {attachmentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                {attachmentCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 rounded ${
            item.notes ? 'text-emerald-600' : 'text-gray-400'
          } hover:bg-gray-100`}
        >
          {item.notes ? (
            <MessageSquare className="h-4 w-4" />
          ) : isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-3">
          {/* Linked Note Info */}
          {hasLinkedNote && (
            <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
              <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-indigo-900 truncate">
                  {item.linked_note?.title || NOTE_TYPE_LABELS[item.linked_note?.type || 'visit']}
                </p>
                {attachmentCount > 0 && (
                  <p className="text-xs text-indigo-600 flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    {attachmentCount} attachment{attachmentCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {onViewNote && (
                  <button
                    onClick={() => onViewNote(item.linked_note!)}
                    className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 rounded"
                  >
                    View
                  </button>
                )}
                {onUnlinkNote && !disabled && (
                  <button
                    onClick={handleUnlink}
                    disabled={isUnlinking}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Unlink note"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Link Note Button (when no note linked) */}
          {!hasLinkedNote && onLinkNote && !disabled && (
            <button
              onClick={() => onLinkNote(item.id)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Link2 className="h-4 w-4" />
              Link a Note
            </button>
          )}

          {/* Inline Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            disabled={disabled}
            placeholder="Add notes..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
          {isSavingNotes && (
            <p className="text-xs text-gray-400">Saving...</p>
          )}
        </div>
      )}
    </div>
  )
}
