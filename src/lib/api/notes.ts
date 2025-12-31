import { createClient } from '@/lib/supabase/server'
import type { Note, NotesFilter, Tag, NoteAttachment } from '@/types'

export async function getNotes(
  filter: NotesFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<{ notes: Note[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('notes')
    .select(`
      *,
      tags:note_tags(tag:tags(*)),
      attachments:note_attachments(*)
    `, { count: 'exact' })

  // Apply filters
  if (filter.dealerId) {
    query = query.eq('dealer_id', filter.dealerId)
  }

  if (filter.type) {
    query = query.eq('type', filter.type)
  }

  if (filter.startDate) {
    query = query.gte('visit_date', filter.startDate)
  }

  if (filter.endDate) {
    query = query.lte('visit_date', filter.endDate)
  }

  if (filter.search) {
    query = query.or(`body.ilike.%${filter.search}%,title.ilike.%${filter.search}%`)
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching notes:', error)
    return { notes: [], total: 0 }
  }

  // Transform the nested tag structure
  const notes = (data || []).map(note => ({
    ...note,
    tags: note.tags?.map((nt: { tag: Tag }) => nt.tag).filter(Boolean) || [],
    attachments: note.attachments || []
  })) as Note[]

  // Filter by tags if specified (done in JS since it's a many-to-many)
  let filteredNotes = notes
  if (filter.tagIds && filter.tagIds.length > 0) {
    filteredNotes = notes.filter(note => 
      note.tags?.some(tag => filter.tagIds!.includes(tag.id))
    )
  }

  return { notes: filteredNotes, total: count || 0 }
}

export async function getNote(id: string): Promise<Note | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      tags:note_tags(tag:tags(*)),
      attachments:note_attachments(*),
      dealer:dealers(id, dealer_name, account_number)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching note:', error)
    return null
  }

  return {
    ...data,
    tags: data.tags?.map((nt: { tag: Tag }) => nt.tag).filter(Boolean) || [],
    attachments: data.attachments || []
  } as Note
}

export async function getDealerNotes(dealerId: string): Promise<Note[]> {
  const { notes } = await getNotes({ dealerId }, 1, 100)
  return notes
}

export async function getUpcomingFollowUps(days: number = 7): Promise<Note[]> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)
  const futureDateStr = futureDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      dealer:dealers(id, dealer_name, account_number)
    `)
    .gte('follow_up_date', today)
    .lte('follow_up_date', futureDateStr)
    .order('follow_up_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming follow-ups:', error)
    return []
  }

  return data as Note[]
}

export async function getNoteAttachments(noteId: string): Promise<NoteAttachment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('note_attachments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching note attachments:', error)
    return []
  }

  return data as NoteAttachment[]
}

export async function getRecentNotesByType(
  dealerId: string,
  type: string,
  limit: number = 5
): Promise<Note[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('dealer_id', dealerId)
    .eq('type', type)
    .order('visit_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent notes by type:', error)
    return []
  }

  return data as Note[]
}
