'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { NoteType, Note, Tag, DealerEmail } from '@/types'

// =============================================
// NOTES CRUD
// =============================================

export async function createNote(dealerId: string, formData: FormData): Promise<{ success: boolean; noteId?: string; error?: string }> {
  const supabase = await createClient()

  const type = formData.get('type') as NoteType
  const title = formData.get('title') as string || null
  const body = formData.get('body') as string
  const visitDate = formData.get('visit_date') as string || new Date().toISOString().split('T')[0]
  const followUpDate = formData.get('follow_up_date') as string || null
  const tagIdsJson = formData.get('tag_ids') as string

  if (!body?.trim()) {
    return { success: false, error: 'Note body is required' }
  }

  // Create the note
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      dealer_id: dealerId,
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

  // Add tags if any
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

  revalidatePath(`/dealers/${dealerId}/notes`)
  revalidatePath(`/dealers/${dealerId}`)

  return { success: true, noteId: note.id }
}

export async function updateNote(noteId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const type = formData.get('type') as NoteType
  const title = formData.get('title') as string || null
  const body = formData.get('body') as string
  const visitDate = formData.get('visit_date') as string
  const followUpDate = formData.get('follow_up_date') as string || null
  const tagIdsJson = formData.get('tag_ids') as string
  const dealerId = formData.get('dealer_id') as string

  if (!body?.trim()) {
    return { success: false, error: 'Note body is required' }
  }

  // Update the note
  const { error: noteError } = await supabase
    .from('notes')
    .update({
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

  // Update tags: delete existing, insert new
  if (tagIdsJson !== undefined) {
    // Delete existing tags
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

  if (dealerId) {
    revalidatePath(`/dealers/${dealerId}/notes`)
    revalidatePath(`/dealers/${dealerId}`)
  }

  return { success: true }
}

export async function deleteNote(noteId: string, dealerId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Note: attachments and tags cascade delete via FK

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)

  if (error) {
    console.error('Failed to delete note:', error)
    return { success: false, error: 'Failed to delete note' }
  }

  revalidatePath(`/dealers/${dealerId}/notes`)
  revalidatePath(`/dealers/${dealerId}`)

  return { success: true }
}

// =============================================
// TAGS CRUD
// =============================================

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

export async function deleteTag(tagId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)

  if (error) {
    console.error('Failed to delete tag:', error)
    return { success: false, error: 'Failed to delete tag' }
  }

  return { success: true }
}

// =============================================
// ATTACHMENTS
// =============================================

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

  // Get the attachment to find the storage path
  const { data: attachment, error: fetchError } = await supabase
    .from('note_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single()

  if (fetchError) {
    console.error('Failed to fetch attachment:', fetchError)
    return { success: false, error: 'Attachment not found' }
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('note-attachments')
    .remove([attachment.storage_path])

  if (storageError) {
    console.error('Failed to delete from storage:', storageError)
  }

  // Delete the record
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

// =============================================
// DEALER EMAILS
// =============================================

export async function getDealerEmails(dealerId: string): Promise<DealerEmail[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dealer_emails')
    .select('*')
    .eq('dealer_id', dealerId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch dealer emails:', error)
    return []
  }

  return data as DealerEmail[]
}

export async function addDealerEmail(
  dealerId: string,
  email: string,
  label?: string,
  isPrimary?: boolean
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const supabase = await createClient()

  // If setting as primary, unset existing primary
  if (isPrimary) {
    await supabase
      .from('dealer_emails')
      .update({ is_primary: false })
      .eq('dealer_id', dealerId)
  }

  const { data, error } = await supabase
    .from('dealer_emails')
    .insert({
      dealer_id: dealerId,
      email: email.trim(),
      label: label?.trim() || null,
      is_primary: isPrimary || false
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to add dealer email:', error)
    return { success: false, error: 'Failed to add email' }
  }

  revalidatePath(`/dealers/${dealerId}/attributes`)

  return { success: true, emailId: data.id }
}

export async function updateDealerEmail(
  emailId: string,
  dealerId: string,
  updates: { email?: string; label?: string; is_primary?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // If setting as primary, unset existing primary
  if (updates.is_primary) {
    await supabase
      .from('dealer_emails')
      .update({ is_primary: false })
      .eq('dealer_id', dealerId)
  }

  const { error } = await supabase
    .from('dealer_emails')
    .update({
      ...updates,
      email: updates.email?.trim(),
      label: updates.label?.trim() || null
    })
    .eq('id', emailId)

  if (error) {
    console.error('Failed to update dealer email:', error)
    return { success: false, error: 'Failed to update email' }
  }

  revalidatePath(`/dealers/${dealerId}/attributes`)

  return { success: true }
}

export async function removeDealerEmail(emailId: string, dealerId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('dealer_emails')
    .delete()
    .eq('id', emailId)

  if (error) {
    console.error('Failed to delete dealer email:', error)
    return { success: false, error: 'Failed to delete email' }
  }

  revalidatePath(`/dealers/${dealerId}/attributes`)

  return { success: true }
}
