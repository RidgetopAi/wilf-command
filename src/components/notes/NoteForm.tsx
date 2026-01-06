'use client'

import { useState, useTransition } from 'react'
import { Note, NoteType, Tag, NoteAttachment, Dealer } from '@/types'
import { NoteTypeSelector } from './NoteTypeSelector'
import { TagPicker } from './TagPicker'
import { AttachmentUploader, PendingAttachment } from './AttachmentUploader'
import { AttachmentPreview } from './AttachmentPreview'
import { X, Calendar, Save, Loader2, Store, ChevronDown, CalendarDays } from 'lucide-react'

interface UploadedAttachment {
  storagePath: string
  fileName: string
  mimeType: string
  fileSize: number
}

interface DealerOption {
  id: string
  dealer_name: string
  account_number: string
}

interface EventOption {
  id: string
  title: string
  date: string
  event_type: string
  dealer_name?: string
}

interface NoteFormProps {
  dealerId?: string | null
  travelStopId?: string | null
  note?: Note
  tags: Tag[]
  dealers?: DealerOption[]
  events?: EventOption[]
  onSave: (formData: FormData) => Promise<{ success: boolean; error?: string; noteId?: string }>
  onCancel: () => void
  onTagCreate?: (name: string) => Promise<Tag | null>
  onAttachmentAdd?: (noteId: string, attachment: UploadedAttachment) => Promise<void>
  onAttachmentDelete?: (attachmentId: string) => Promise<void>
}

export function NoteForm({ 
  dealerId: initialDealerId, 
  travelStopId: initialTravelStopId,
  note, 
  tags, 
  dealers,
  events,
  onSave, 
  onCancel,
  onTagCreate,
  onAttachmentAdd,
  onAttachmentDelete
}: NoteFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(
    note?.dealer_id || initialDealerId || null
  )
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    note?.travel_stop_id || initialTravelStopId || null
  )
  const [type, setType] = useState<NoteType>(note?.type || 'visit')
  const [title, setTitle] = useState(note?.title || '')
  const [body, setBody] = useState(note?.body || '')
  const [visitDate, setVisitDate] = useState(
    note?.visit_date || new Date().toISOString().split('T')[0]
  )
  const [followUpDate, setFollowUpDate] = useState(note?.follow_up_date || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    note?.tags?.map(t => t.id) || []
  )
  
  // Attachments state
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([])
  const [existingAttachments, setExistingAttachments] = useState<NoteAttachment[]>(
    note?.attachments || []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!body.trim()) {
      setError('Note content is required')
      return
    }

    // Check if there are still uploads in progress
    if (pendingAttachments.some(p => p.uploading)) {
      setError('Please wait for attachments to finish uploading')
      return
    }

    const formData = new FormData()
    formData.set('type', type)
    formData.set('title', title)
    formData.set('body', body)
    formData.set('visit_date', visitDate)
    formData.set('follow_up_date', followUpDate)
    formData.set('tag_ids', JSON.stringify(selectedTagIds))
    if (selectedDealerId) {
      formData.set('dealer_id', selectedDealerId)
    }
    if (selectedEventId) {
      formData.set('travel_stop_id', selectedEventId)
    }
    
    // Include pending attachment info for the server to create records
    formData.set('new_attachments', JSON.stringify(uploadedAttachments))

    startTransition(async () => {
      const result = await onSave(formData)
      if (!result.success) {
        setError(result.error || 'Failed to save note')
      } else if (uploadedAttachments.length > 0 && onAttachmentAdd) {
        // Add attachment records after note is saved
        // For new notes use result.noteId, for edits use existing note.id
        const targetNoteId = result.noteId || note?.id
        if (targetNoteId) {
          for (const attachment of uploadedAttachments) {
            await onAttachmentAdd(targetNoteId, attachment)
          }
        }
      }
    })
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleUploadComplete = (attachment: UploadedAttachment) => {
    setUploadedAttachments(prev => [...prev, attachment])
  }

  const handleDeleteExisting = async (attachmentId: string) => {
    if (onAttachmentDelete) {
      await onAttachmentDelete(attachmentId)
      setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-black/50 sm:flex sm:items-center sm:justify-center">
      <div className="h-full w-full sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:rounded-xl bg-white overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 -m-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <NoteTypeSelector value={type} onChange={setType} />
            </div>

            {/* Dealer Picker (only shown when dealers list is provided) */}
            {dealers && dealers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Store className="w-4 h-4 inline mr-1" />
                  Dealer <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedDealerId || ''}
                    onChange={e => setSelectedDealerId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10"
                  >
                    <option value="">No dealer assigned</option>
                    {dealers.map(dealer => (
                      <option key={dealer.id} value={dealer.id}>
                        {dealer.dealer_name} (#{dealer.account_number})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Event Picker (only shown when events list is provided) */}
            {events && events.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarDays className="w-4 h-4 inline mr-1" />
                  Link to Event <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedEventId || ''}
                    onChange={e => setSelectedEventId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10"
                  >
                    <option value="">No event linked</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {new Date(event.date).toLocaleDateString()}
                        {event.dealer_name ? ` (${event.dealer_name})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Title (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief summary..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Body (required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note <span className="text-red-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Enter your note..."
                rows={6}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <TagPicker
                tags={tags}
                selectedIds={selectedTagIds}
                onToggle={handleTagToggle}
                onCreate={onTagCreate}
              />
            </div>

            {/* Existing Attachments (when editing) */}
            {existingAttachments.length > 0 && (
              <AttachmentPreview
                attachments={existingAttachments}
                onDelete={onAttachmentDelete ? handleDeleteExisting : undefined}
              />
            )}

            {/* Attachment Uploader */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <AttachmentUploader
                noteId={note?.id}
                dealerId={selectedDealerId}
                onUploadComplete={handleUploadComplete}
                onPendingChange={setPendingAttachments}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending || !body.trim() || pendingAttachments.some(p => p.uploading)}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Note
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
