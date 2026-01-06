'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { NoteType, Note, Tag } from '@/types'

export async function createNote(formData: FormData): Promise<{ success: boolean; noteId?: string; error?: string }> {
  const supabase = await createClient()

  const dealerId = formData.get('dealer_id') as string || null
  const travelStopId = formData.get('travel_stop_id') as string || null
  const type = formData.get('type') as NoteType
  const title = formData.get('title') as string || null
  const body = formData.get('body') as string
  const visitDate = formData.get('visit_date') as string || new Date().toISOString().split('T')[0]
  const followUpDate = formData.get('follow_up_date') as string || null
  const tagIdsJson = formData.get('tag_ids') as string

  if (!body?.trim()) {
    return { success: false, error: 'Note body is required' }
  }

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      dealer_id: dealerId || null,
      travel_stop_id: travelStopId || null,
      type: type || 'visit',
      title: title?.trim() || null,
      body: body.trim(),
      visit_date: visitDate,
      follow_up_date: followUpDate || null
    })
    .select('id')
    .single()

  if (noteError) {
    console.error('Failed to create note:', noteError)
    return { success: false, error: 'Failed to create note' }
  }

  if (tagIdsJson) {
    try {
      const tagIds = JSON.parse(tagIdsJson) as string[]
      if (tagIds.length > 0) {
        const tagRecords = tagIds.map(tagId => ({
          note_id: note.id,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(tagRecords)

        if (tagError) {
          console.error('Failed to add tags:', tagError)
        }
      }
    } catch {
      console.error('Invalid tag_ids JSON')
    }
  }

  revalidatePath('/notes')
  if (dealerId) {
    revalidatePath(`/dealers/${dealerId}/notes`)
    revalidatePath(`/dealers/${dealerId}`)
  }
  if (travelStopId) {
    revalidatePath('/travel-calendar')
  }

  return { success: true, noteId: note.id }
}

export async function updateNote(noteId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const dealerId = formData.get('dealer_id') as string || null
  const travelStopId = formData.get('travel_stop_id') as string || null
  const type = formData.get('type') as NoteType
  const title = formData.get('title') as string || null
  const body = formData.get('body') as string
  const visitDate = formData.get('visit_date') as string
  const followUpDate = formData.get('follow_up_date') as string || null
  const tagIdsJson = formData.get('tag_ids') as string

  if (!body?.trim()) {
    return { success: false, error: 'Note body is required' }
  }

  const { error: noteError } = await supabase
    .from('notes')
    .update({
      dealer_id: dealerId || null,
      travel_stop_id: travelStopId || null,
      type,
      title: title?.trim() || null,
      body: body.trim(),
      visit_date: visitDate,
      follow_up_date: followUpDate || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', noteId)

  if (noteError) {
    console.error('Failed to update note:', noteError)
    return { success: false, error: 'Failed to update note' }
  }

  if (tagIdsJson !== undefined) {
    await supabase.from('note_tags').delete().eq('note_id', noteId)

    try {
      const tagIds = JSON.parse(tagIdsJson || '[]') as string[]
      if (tagIds.length > 0) {
        const tagRecords = tagIds.map(tagId => ({
          note_id: noteId,
          tag_id: tagId
        }))

        await supabase.from('note_tags').insert(tagRecords)
      }
    } catch {
      console.error('Invalid tag_ids JSON')
    }
  }

  revalidatePath('/notes')
  if (dealerId) {
    revalidatePath(`/dealers/${dealerId}/notes`)
  }

  return { success: true }
}

export async function deleteNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get note first to know which dealer to revalidate
  const { data: note } = await supabase
    .from('notes')
    .select('dealer_id')
    .eq('id', noteId)
    .single()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)

  if (error) {
    console.error('Failed to delete note:', error)
    return { success: false, error: 'Failed to delete note' }
  }

  revalidatePath('/notes')
  if (note?.dealer_id) {
    revalidatePath(`/dealers/${note.dealer_id}/notes`)
    revalidatePath(`/dealers/${note.dealer_id}`)
  }

  return { success: true }
}

export async function createTag(name: string, color?: string): Promise<{ success: boolean; tag?: Tag; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .insert({
      name: name.trim(),
      color: color || null
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Tag already exists' }
    }
    console.error('Failed to create tag:', error)
    return { success: false, error: 'Failed to create tag' }
  }

  return { success: true, tag: data as Tag }
}

export async function addNoteAttachment(
  noteId: string,
  storagePath: string,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<{ success: boolean; attachmentId?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('note_attachments')
    .insert({
      note_id: noteId,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      file_size: fileSize
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to add attachment:', error)
    return { success: false, error: 'Failed to add attachment' }
  }

  return { success: true, attachmentId: data.id }
}

export async function removeNoteAttachment(attachmentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: attachment, error: fetchError } = await supabase
    .from('note_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single()

  if (fetchError) {
    console.error('Failed to fetch attachment:', fetchError)
    return { success: false, error: 'Attachment not found' }
  }

  const { error: storageError } = await supabase.storage
    .from('note-attachments')
    .remove([attachment.storage_path])

  if (storageError) {
    console.error('Failed to delete from storage:', storageError)
  }

  const { error: deleteError } = await supabase
    .from('note_attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    console.error('Failed to delete attachment record:', deleteError)
    return { success: false, error: 'Failed to delete attachment' }
  }

  return { success: true }
}
