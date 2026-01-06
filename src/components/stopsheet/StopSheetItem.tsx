'use client'

import { useState } from 'react'
import { Check, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import type { StopSheetItem as StopSheetItemType } from '@/types'

interface StopSheetItemProps {
  item: StopSheetItemType
  disabled?: boolean
  onToggle: (itemId: string, isChecked: boolean) => Promise<void>
  onUpdateNotes: (itemId: string, notes: string) => Promise<void>
}

export function StopSheetItem({ item, disabled, onToggle, onUpdateNotes }: StopSheetItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

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
        <div className="px-3 pb-3 pt-0">
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
            <p className="text-xs text-gray-400 mt-1">Saving...</p>
          )}
        </div>
      )}
    </div>
  )
}
