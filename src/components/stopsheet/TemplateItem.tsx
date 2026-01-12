'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Pencil, Check, X, FileText, Link2, Unlink, Paperclip } from 'lucide-react'
import type { StopSheetTemplate, Note } from '@/types'
import { NOTE_TYPE_LABELS } from '@/types'

interface TemplateItemProps {
  item: StopSheetTemplate
  onUpdate: (id: string, label: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onLinkNote?: (id: string) => void
  onViewNote?: (note: Note) => void
  onUnlinkNote?: (id: string) => Promise<void>
}

export function TemplateItem({
  item,
  onUpdate,
  onDelete,
  onLinkNote,
  onViewNote,
  onUnlinkNote
}: TemplateItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.label)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const hasLinkedNote = !!item.linked_note
  const attachmentCount = item.linked_note?.attachments?.length || 0

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleSave = async () => {
    if (editValue.trim() && editValue.trim() !== item.label) {
      await onUpdate(item.id, editValue.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(item.label)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(item.id)
  }

  const handleUnlink = async () => {
    if (!onUnlinkNote || isUnlinking) return
    setIsUnlinking(true)
    await onUnlinkNote(item.id)
    setIsUnlinking(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg ${
        isDragging ? 'shadow-lg ring-2 ring-emerald-500' : ''
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="p-1 text-emerald-600 hover:text-emerald-700"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm text-gray-900">{item.label}</span>

            {/* Linked Note Indicator */}
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

            {/* Link Note Button (when no note linked) */}
            {!hasLinkedNote && onLinkNote && (
              <button
                onClick={() => onLinkNote(item.id)}
                className="p-1 text-gray-400 hover:text-indigo-600"
                title="Link a note"
              >
                <Link2 className="h-4 w-4" />
              </button>
            )}

            {/* Unlink Button (when note is linked) */}
            {hasLinkedNote && onUnlinkNote && (
              <button
                onClick={handleUnlink}
                disabled={isUnlinking}
                className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                title="Unlink note"
              >
                <Unlink className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Linked Note Preview */}
      {hasLinkedNote && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-sm">
            <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
            <span className="flex-1 text-indigo-900 truncate">
              {item.linked_note?.title || NOTE_TYPE_LABELS[item.linked_note?.type || 'visit']}
            </span>
            {attachmentCount > 0 && (
              <span className="text-xs text-indigo-600 flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {attachmentCount}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
