import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Note, NotesFilter, Tag } from '@/types'
import { 
  createNote, 
  updateNote, 
  deleteNote, 
  createTag,
  addNoteAttachment,
  removeNoteAttachment 
} from '@/app/(dashboard)/dealers/[id]/notes/actions'

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filter: NotesFilter) => [...noteKeys.lists(), filter] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
  dealer: (dealerId: string) => [...noteKeys.all, 'dealer', dealerId] as const,
  followUps: (days?: number) => [...noteKeys.all, 'follow-ups', days] as const,
}

export const tagKeys = {
  all: ['tags'] as const,
  list: () => [...tagKeys.all, 'list'] as const,
}

interface UseNotesOptions {
  filter: NotesFilter
  page?: number
  pageSize?: number
}

interface NotesResponse {
  notes: Note[]
  total: number
}

/**
 * Fetch notes with filtering and pagination
 * Uses server-side data fetching, primarily for cache invalidation
 */
export function useNotes({ filter, page = 1, pageSize = 20 }: UseNotesOptions) {
  return useQuery<NotesResponse, Error>({
    queryKey: noteKeys.list({ ...filter, page, pageSize } as NotesFilter & { page: number; pageSize: number }),
    staleTime: 0, // Always refetch since we use server components primarily
    enabled: !!filter.dealerId,
  })
}

/**
 * Create a new note
 */
export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dealerId, formData }: { dealerId: string; formData: FormData }) => {
      const result = await createNote(dealerId, formData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create note')
      }
      return { dealerId, noteId: result.noteId }
    },
    onSuccess: ({ dealerId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.dealer(dealerId) })
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: noteKeys.followUps() })
    },
  })
}

/**
 * Update an existing note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, dealerId, formData }: { noteId: string; dealerId: string; formData: FormData }) => {
      formData.append('dealer_id', dealerId)
      const result = await updateNote(noteId, formData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update note')
      }
      return { noteId, dealerId }
    },
    onSuccess: ({ noteId, dealerId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(noteId) })
      queryClient.invalidateQueries({ queryKey: noteKeys.dealer(dealerId) })
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: noteKeys.followUps() })
    },
  })
}

/**
 * Delete a note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, dealerId }: { noteId: string; dealerId: string }) => {
      const result = await deleteNote(noteId, dealerId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete note')
      }
      return { noteId, dealerId }
    },
    onSuccess: ({ dealerId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.dealer(dealerId) })
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: noteKeys.followUps() })
    },
  })
}

/**
 * Create a new tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const result = await createTag(name, color)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create tag')
      }
      return result.tag as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.list() })
    },
  })
}

/**
 * Add attachment to a note
 */
export function useAddAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      noteId, 
      storagePath, 
      fileName, 
      mimeType, 
      fileSize 
    }: { 
      noteId: string
      storagePath: string
      fileName: string
      mimeType: string
      fileSize: number
    }) => {
      const result = await addNoteAttachment(noteId, storagePath, fileName, mimeType, fileSize)
      if (!result.success) {
        throw new Error(result.error || 'Failed to add attachment')
      }
      return { noteId, attachmentId: result.attachmentId }
    },
    onSuccess: ({ noteId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(noteId) })
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}

/**
 * Remove attachment from a note
 */
export function useRemoveAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ attachmentId, noteId }: { attachmentId: string; noteId: string }) => {
      const result = await removeNoteAttachment(attachmentId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove attachment')
      }
      return { attachmentId, noteId }
    },
    onSuccess: ({ noteId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(noteId) })
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}
