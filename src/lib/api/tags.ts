import { createClient } from '@/lib/supabase/server'
import type { Tag } from '@/types'

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  return data as Tag[]
}

export async function getTag(id: string): Promise<Tag | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching tag:', error)
    return null
  }

  return data as Tag
}

export async function searchTags(query: string): Promise<Tag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error searching tags:', error)
    return []
  }

  return data as Tag[]
}

export async function getTagsForNote(noteId: string): Promise<Tag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('note_tags')
    .select('tag:tags(*)')
    .eq('note_id', noteId)

  if (error) {
    console.error('Error fetching tags for note:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((nt: any) => nt.tag).filter(Boolean) as Tag[]
}

export async function getPopularTags(limit: number = 10): Promise<(Tag & { count: number })[]> {
  const supabase = await createClient()

  // Get all note_tags and count by tag_id
  const { data: noteTags, error: noteTagsError } = await supabase
    .from('note_tags')
    .select('tag_id')

  if (noteTagsError) {
    console.error('Error fetching note tags:', noteTagsError)
    return []
  }

  // Count occurrences
  const tagCounts = new Map<string, number>()
  noteTags.forEach(nt => {
    tagCounts.set(nt.tag_id, (tagCounts.get(nt.tag_id) || 0) + 1)
  })

  // Get tag details
  const tagIds = Array.from(tagCounts.keys())
  if (tagIds.length === 0) return []

  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds)

  if (tagsError) {
    console.error('Error fetching tags:', tagsError)
    return []
  }

  // Combine and sort
  const tagsWithCount = tags.map(tag => ({
    ...tag,
    count: tagCounts.get(tag.id) || 0
  }))

  return tagsWithCount
    .sort((a, b) => b.count - a.count)
    .slice(0, limit) as (Tag & { count: number })[]
}
