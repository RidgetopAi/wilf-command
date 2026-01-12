'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Unlock, FileDown, ClipboardCheck, Trash2 } from 'lucide-react'
import { StopSheetItem } from '@/components/stopsheet/StopSheetItem'
import { NoteLinkModal } from '@/components/stopsheet/NoteLinkModal'
import { NoteDetailDrawer } from '@/components/notes/NoteDetailDrawer'
import { exportStopSheetAsPdf } from '@/lib/utils/stopsheetExport'
import {
  getStopSheet,
  toggleStopSheetItem,
  updateStopSheetItemNotes,
  completeStopSheet,
  unlockStopSheet,
  deleteStopSheet,
  linkNoteToStopSheetItem,
  unlinkNoteFromStopSheetItem,
  getNotesForLinking
} from '../actions'
import type { StopSheet, StopSheetItem as StopSheetItemType, Note, NoteType } from '@/types'

export default function StopSheetExecutionPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [stopsheetId, setStopsheetId] = useState<string>('')
  const [stopsheet, setStopsheet] = useState<StopSheet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Note linking state
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null)
  const [notesForLink, setNotesForLink] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [noteTypeFilter, setNoteTypeFilter] = useState<NoteType | ''>('promotion')
  const [noteSearchQuery, setNoteSearchQuery] = useState('')
  const [viewingNote, setViewingNote] = useState<Note | null>(null)

  const loadStopsheet = useCallback(async (id: string) => {
    const data = await getStopSheet(id)
    setStopsheet(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const resolvedParams = await params
      setStopsheetId(resolvedParams.id)
      loadStopsheet(resolvedParams.id)
    }
    init()
  }, [params, loadStopsheet])

  // Load notes when link modal opens or filters change
  useEffect(() => {
    if (linkModalOpen && stopsheet?.dealer_id) {
      setIsLoadingNotes(true)
      getNotesForLinking(
        stopsheet.dealer_id,
        noteTypeFilter || undefined,
        noteSearchQuery || undefined
      ).then(notes => {
        setNotesForLink(notes)
        setIsLoadingNotes(false)
      })
    }
  }, [linkModalOpen, stopsheet?.dealer_id, noteTypeFilter, noteSearchQuery])

  const handleToggle = async (itemId: string, isChecked: boolean) => {
    // Optimistic update
    setStopsheet(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items?.map(i =>
          i.id === itemId ? { ...i, is_checked: isChecked } : i
        )
      }
    })
    await toggleStopSheetItem(itemId, isChecked)
  }

  const handleUpdateNotes = async (itemId: string, notes: string) => {
    setStopsheet(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items?.map(i =>
          i.id === itemId ? { ...i, notes } : i
        )
      }
    })
    await updateStopSheetItemNotes(itemId, notes)
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    const result = await completeStopSheet(stopsheetId)
    if (result.success) {
      setStopsheet(prev => prev ? { ...prev, status: 'completed' } : prev)
    }
    setIsCompleting(false)
    setShowCompleteConfirm(false)
  }

  const handleUnlock = async () => {
    const result = await unlockStopSheet(stopsheetId)
    if (result.success) {
      setStopsheet(prev => prev ? { ...prev, status: 'in_progress' } : prev)
    }
    setShowUnlockConfirm(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteStopSheet(stopsheetId)
    if (result.success) {
      router.push('/stopsheet')
    } else {
      alert(result.error || 'Failed to delete')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Note linking handlers
  const handleOpenLinkModal = (itemId: string) => {
    setLinkingItemId(itemId)
    setLinkModalOpen(true)
  }

  const handleLinkNote = async (noteId: string) => {
    if (!linkingItemId) return

    const result = await linkNoteToStopSheetItem(linkingItemId, noteId)
    if (result.success) {
      // Refresh stopsheet to get updated data
      loadStopsheet(stopsheetId)
    }
    setLinkModalOpen(false)
    setLinkingItemId(null)
  }

  const handleUnlinkNote = async (itemId: string) => {
    const result = await unlinkNoteFromStopSheetItem(itemId)
    if (result.success) {
      setStopsheet(prev => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items?.map(i =>
            i.id === itemId ? { ...i, note_id: null, linked_note: undefined } : i
          )
        }
      })
    }
  }

  const handleViewNote = (note: Note) => {
    setViewingNote(note)
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!stopsheet) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">StopSheet not found</p>
        <Link href="/stopsheet" className="text-emerald-600 hover:underline mt-2 inline-block">
          Back to StopSheet
        </Link>
      </div>
    )
  }

  const isLocked = stopsheet.status === 'completed'
  const basicsItems = stopsheet.items?.filter(i => i.section === 'basics') || []
  const objectivesItems = stopsheet.items?.filter(i => i.section === 'objectives') || []
  const totalItems = (stopsheet.items || []).length
  const checkedItems = (stopsheet.items || []).filter(i => i.is_checked).length
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/stopsheet"
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {stopsheet.dealer?.dealer_name || 'StopSheet'}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(stopsheet.visit_date).toLocaleDateString()}
          </p>
        </div>
        {isLocked && (
          <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
            Completed
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">{checkedItems} of {totalItems} completed</span>
          <span className="font-medium text-gray-900">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Basics Section */}
      {basicsItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">The Basics</h2>
          <div className="space-y-2">
            {basicsItems.map(item => (
              <StopSheetItem
                key={item.id}
                item={item}
                disabled={isLocked}
                onToggle={handleToggle}
                onUpdateNotes={handleUpdateNotes}
                onLinkNote={handleOpenLinkModal}
                onViewNote={handleViewNote}
                onUnlinkNote={handleUnlinkNote}
              />
            ))}
          </div>
        </div>
      )}

      {/* Objectives Section */}
      {objectivesItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Monthly Objectives</h2>
          <div className="space-y-2">
            {objectivesItems.map(item => (
              <StopSheetItem
                key={item.id}
                item={item}
                disabled={isLocked}
                onToggle={handleToggle}
                onUpdateNotes={handleUpdateNotes}
                onLinkNote={handleOpenLinkModal}
                onViewNote={handleViewNote}
                onUnlinkNote={handleUnlinkNote}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No checklist items</p>
          <Link href="/stopsheet/editor" className="text-emerald-600 hover:underline text-sm mt-1 inline-block">
            Set up your template
          </Link>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 max-w-2xl mx-auto">
        {isLocked ? (
          <>
            <button
              onClick={() => setShowUnlockConfirm(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Unlock className="h-4 w-4" />
              Unlock to Edit
            </button>
            <button
              onClick={() => stopsheet && exportStopSheetAsPdf(stopsheet)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCompleteConfirm(true)}
              disabled={isCompleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {isCompleting ? 'Completing...' : 'Finish & Lock'}
            </button>
          </>
        )}
      </div>

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCompleteConfirm(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-xl p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete StopSheet?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will lock the stopsheet. You can unlock it later if needed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {isCompleting ? 'Completing...' : 'Complete'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Unlock Confirmation Modal */}
      {showUnlockConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowUnlockConfirm(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-xl p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlock StopSheet?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will allow you to make changes to this stopsheet.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnlockConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Unlock
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-xl p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete StopSheet?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete this stopsheet. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Note Link Modal */}
      <NoteLinkModal
        isOpen={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false)
          setLinkingItemId(null)
        }}
        onSelect={handleLinkNote}
        notes={notesForLink}
        isLoading={isLoadingNotes}
        typeFilter={noteTypeFilter}
        onTypeFilterChange={setNoteTypeFilter}
        searchQuery={noteSearchQuery}
        onSearchChange={setNoteSearchQuery}
      />

      {/* Note Detail Drawer */}
      {viewingNote && (
        <NoteDetailDrawer
          note={viewingNote}
          onClose={() => setViewingNote(null)}
        />
      )}
    </div>
  )
}
