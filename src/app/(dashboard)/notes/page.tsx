'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
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

export default function NotesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const noteIdParam = searchParams.get('noteId')

  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [dealers, setDealers] = useState<DealerOption[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [filters, setFilters] = useState<NotesFilterState>({})

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Fetch all notes with tags and dealer info
      const { data: notesData } = await supabase
        .from('notes')
        .select(`
          *,
          tags:note_tags(tag:tags(*)),
          attachments:note_attachments(*),
          dealer:dealers(id, dealer_name, account_number)
        `)
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

      // Fetch dealers for the picker
      const { data: dealersData } = await supabase
        .from('dealers')
        .select('id, dealer_name, account_number')
        .order('dealer_name', { ascending: true })
      
      if (dealersData) {
        setDealers(dealersData as DealerOption[])
      }

      // Fetch upcoming events for linking
      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 60) // 60 days ahead
      const futureDateStr = futureDate.toISOString().split('T')[0]

      const { data: eventsData } = await supabase
        .from('travel_stops')
        .select(`
          id,
          event_title,
          event_type,
          dealer:dealers(dealer_name),
          travel_day:travel_days!inner(date)
        `)
        .gte('travel_days.date', today)
        .lte('travel_days.date', futureDateStr)
        .order('travel_days(date)', { ascending: true })
      
      if (eventsData) {
        const transformedEvents = eventsData
          .filter((e): e is typeof e & { travel_day: { date: string } } => 
            e.travel_day !== null && typeof e.travel_day === 'object' && 'date' in e.travel_day
          )
          .map(stop => ({
            id: stop.id,
            title: stop.event_title || (stop.dealer as { dealer_name?: string })?.dealer_name || 'Untitled',
            date: stop.travel_day.date,
            event_type: stop.event_type,
            dealer_name: (stop.dealer as { dealer_name?: string })?.dealer_name
          }))
        setEvents(transformedEvents)
      }
      
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  // Auto-open note from URL param (e.g., /notes?noteId=xxx)
  useEffect(() => {
    if (noteIdParam && notes.length > 0 && !viewingNote) {
      const note = notes.find(n => n.id === noteIdParam)
      if (note) {
        setViewingNote(note)
        // Clear the URL param after opening
        router.replace('/notes', { scroll: false })
      }
    }
  }, [noteIdParam, notes, viewingNote, router])

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
        n.title?.toLowerCase().includes(searchLower) ||
        n.dealer?.dealer_name?.toLowerCase().includes(searchLower)
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
      const result = await deleteNote(viewingNote.id)
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
        await refreshNotes()
        setShowNoteForm(false)
        setEditingNote(null)
      }
      return result
    } else {
      const result = await createNote(formData)
      if (result.success) {
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
        attachments:note_attachments(*),
        dealer:dealers(id, dealer_name, account_number)
      `)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-gray-400" />
          Notes
        </h1>
        <p className="text-sm text-gray-500">All notes across dealers</p>
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
        showDealer
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
          key={editingNote?.id ?? 'new'}
          note={editingNote || undefined}
          tags={tags}
          dealers={dealers}
          events={events}
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
