'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { Note, Tag, NoteType } from '@/types'
import { 
  NoteForm, 
  NoteList, 
  NotesFilterBar, 
  AddNoteFab,
  NoteDetailDrawer,
  NotesFilterState 
} from '@/components/notes'
import { createNote, updateNote, deleteNote, createTag, addNoteAttachment, removeNoteAttachment } from './actions'
import { createClient } from '@/lib/supabase/client'

interface NotesPageProps {
  params: Promise<{ id: string }>
}

export default function NotesPage({ params }: NotesPageProps) {
  const router = useRouter()
  const [dealerId, setDealerId] = useState<string>('')
  const [dealerName, setDealerName] = useState<string>('')
  const [accountNumber, setAccountNumber] = useState<string>('')
  
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [filters, setFilters] = useState<NotesFilterState>({})

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      setDealerId(resolvedParams.id)
      
      const supabase = createClient()
      
      // Fetch dealer info
      const { data: dealer } = await supabase
        .from('dealers')
        .select('dealer_name, account_number')
        .eq('id', resolvedParams.id)
        .single()
      
      if (dealer) {
        setDealerName(dealer.dealer_name)
        setAccountNumber(dealer.account_number)
      }
      
      // Fetch notes with tags
      const { data: notesData } = await supabase
        .from('notes')
        .select(`
          *,
          tags:note_tags(tag:tags(*)),
          attachments:note_attachments(*)
        `)
        .eq('dealer_id', resolvedParams.id)
        .order('visit_date', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (notesData) {
        const transformedNotes = notesData.map(note => ({
          ...note,
          tags: note.tags?.map((nt: { tag: Tag }) => nt.tag).filter(Boolean) || [],
          attachments: note.attachments || []
        })) as Note[]
        setNotes(transformedNotes)
        setFilteredNotes(transformedNotes)
      }
      
      // Fetch all tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true })
      
      if (tagsData) {
        setTags(tagsData as Tag[])
      }
      
      setIsLoading(false)
    }
    
    loadData()
  }, [params])

  // Apply filters when they change
  const applyFilters = useCallback((notes: Note[], filters: NotesFilterState): Note[] => {
    let result = [...notes]
    
    // Type filter
    if (filters.type) {
      result = result.filter(n => n.type === filters.type)
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(n => 
        n.body?.toLowerCase().includes(searchLower) ||
        n.title?.toLowerCase().includes(searchLower)
      )
    }
    
    // Tags filter
    if (filters.tagIds && filters.tagIds.length > 0) {
      result = result.filter(n => 
        n.tags?.some(tag => filters.tagIds!.includes(tag.id))
      )
    }
    
    // Date range filter
    if (filters.dateRange) {
      const now = new Date()
      let startDate: Date
      
      switch (filters.dateRange) {
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case '30d':
          startDate = new Date(now.setDate(now.getDate() - 30))
          break
        case '90d':
          startDate = new Date(now.setDate(now.getDate() - 90))
          break
        default:
          return result
      }
      
      result = result.filter(n => new Date(n.visit_date) >= startDate)
    }
    
    return result
  }, [])

  useEffect(() => {
    setFilteredNotes(applyFilters(notes, filters))
  }, [notes, filters, applyFilters])

  const handleFilterChange = (newFilters: NotesFilterState) => {
    setFilters(newFilters)
  }

  const handleNoteClick = (note: Note) => {
    setViewingNote(note)
  }

  const handleViewingNoteEdit = () => {
    if (viewingNote) {
      setEditingNote(viewingNote)
      setViewingNote(null)
      setShowNoteForm(true)
    }
  }

  const handleViewingNoteDelete = async () => {
    if (viewingNote) {
      const result = await deleteNote(viewingNote.id, dealerId)
      if (result.success) {
        setViewingNote(null)
        await refreshNotes()
      }
    }
  }

  const handleAddNote = () => {
    setEditingNote(null)
    setShowNoteForm(true)
  }

  const handleSaveNote = async (formData: FormData): Promise<{ success: boolean; error?: string; noteId?: string }> => {
    if (editingNote) {
      const result = await updateNote(editingNote.id, formData)
      if (result.success) {
        // Refresh notes
        await refreshNotes()
        setShowNoteForm(false)
        setEditingNote(null)
      }
      return result
    } else {
      const result = await createNote(dealerId, formData)
      if (result.success) {
        // Refresh notes
        await refreshNotes()
        setShowNoteForm(false)
      }
      return result
    }
  }

  const handleAttachmentAdd = async (
    noteId: string, 
    attachment: { storagePath: string; fileName: string; mimeType: string; fileSize: number }
  ) => {
    await addNoteAttachment(noteId, attachment.storagePath, attachment.fileName, attachment.mimeType, attachment.fileSize)
    await refreshNotes()
  }

  const handleAttachmentDelete = async (attachmentId: string) => {
    await removeNoteAttachment(attachmentId)
    await refreshNotes()
  }

  const handleCancelNote = () => {
    setShowNoteForm(false)
    setEditingNote(null)
  }

  const handleCreateTag = async (name: string): Promise<Tag | null> => {
    const result = await createTag(name)
    if (result.success && result.tag) {
      setTags(prev => [...prev, result.tag!].sort((a, b) => a.name.localeCompare(b.name)))
      return result.tag
    }
    return null
  }

  const refreshNotes = async () => {
    const supabase = createClient()
    
    const { data: notesData } = await supabase
      .from('notes')
      .select(`
        *,
        tags:note_tags(tag:tags(*)),
        attachments:note_attachments(*)
      `)
      .eq('dealer_id', dealerId)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (notesData) {
      const transformedNotes = notesData.map(note => ({
        ...note,
        tags: note.tags?.map((nt: { tag: Tag }) => nt.tag).filter(Boolean) || [],
        attachments: note.attachments || []
      })) as Note[]
      setNotes(transformedNotes)
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dealers/${dealerId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dealer
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-gray-400" />
          Notes
        </h1>
        <p className="text-sm text-gray-500">{dealerName} - #{accountNumber}</p>
      </div>

      {/* Filter Bar */}
      <NotesFilterBar
        onFilterChange={handleFilterChange}
        tags={tags}
        initialFilters={filters}
      />

      {/* Notes List */}
      <NoteList
        notes={filteredNotes}
        onNoteClick={handleNoteClick}
        emptyMessage={
          filters.type || filters.search || filters.tagIds?.length || filters.dateRange
            ? 'No notes match your filters'
            : 'No notes yet. Tap + to add your first note.'
        }
      />

      {/* Floating Action Button */}
      <AddNoteFab onClick={handleAddNote} />

      {/* Note Detail Drawer */}
      {viewingNote && (
        <NoteDetailDrawer
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onEdit={handleViewingNoteEdit}
          onDelete={handleViewingNoteDelete}
          onAttachmentDelete={handleAttachmentDelete}
        />
      )}

      {/* Note Form Modal */}
      {showNoteForm && (
        <NoteForm
          dealerId={dealerId}
          note={editingNote || undefined}
          tags={tags}
          onSave={handleSaveNote}
          onCancel={handleCancelNote}
          onTagCreate={handleCreateTag}
          onAttachmentAdd={handleAttachmentAdd}
          onAttachmentDelete={handleAttachmentDelete}
        />
      )}
    </div>
  )
}
