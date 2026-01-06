'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { StopSheetSection, StopSheetTemplate, StopSheet, StopSheetItem } from '@/types'

// =============================================
// TEMPLATE ACTIONS
// =============================================

export async function getTemplateItems(): Promise<StopSheetTemplate[]> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return []

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData?.rep_id) return []

  const { data, error } = await supabase
    .from('stopsheet_templates')
    .select('*')
    .eq('rep_id', userData.rep_id)
    .eq('is_active', true)
    .order('section')
    .order('sort_order')

  if (error) {
    console.error('Failed to fetch template items:', error)
    return []
  }

  return data as StopSheetTemplate[]
}

export async function createTemplateItem(
  section: StopSheetSection,
  label: string
): Promise<{ success: boolean; item?: StopSheetTemplate; error?: string }> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: 'Not authenticated' }

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData?.rep_id) return { success: false, error: 'No rep_id found' }

  // Get max sort_order for this section
  const { data: existing } = await supabase
    .from('stopsheet_templates')
    .select('sort_order')
    .eq('rep_id', userData.rep_id)
    .eq('section', section)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('stopsheet_templates')
    .insert({
      rep_id: userData.rep_id,
      section,
      label: label.trim(),
      sort_order: nextOrder
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create template item:', error)
    return { success: false, error: 'Failed to create item' }
  }

  revalidatePath('/stopsheet/editor')
  return { success: true, item: data as StopSheetTemplate }
}

export async function updateTemplateItem(
  id: string,
  label: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stopsheet_templates')
    .update({ label: label.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Failed to update template item:', error)
    return { success: false, error: 'Failed to update item' }
  }

  revalidatePath('/stopsheet/editor')
  return { success: true }
}

export async function deleteTemplateItem(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Soft delete by setting is_active = false
  const { error } = await supabase
    .from('stopsheet_templates')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Failed to delete template item:', error)
    return { success: false, error: 'Failed to delete item' }
  }

  revalidatePath('/stopsheet/editor')
  return { success: true }
}

export async function reorderTemplateItems(
  section: StopSheetSection,
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Update each item's sort_order
  const updates = itemIds.map((id, index) =>
    supabase
      .from('stopsheet_templates')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    console.error('Failed to reorder items')
    return { success: false, error: 'Failed to reorder items' }
  }

  revalidatePath('/stopsheet/editor')
  return { success: true }
}

// =============================================
// STOPSHEET ACTIONS
// =============================================

export async function createStopSheet(
  dealerId: string,
  travelStopId?: string
): Promise<{ success: boolean; stopsheetId?: string; error?: string }> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: 'Not authenticated' }

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData?.rep_id) return { success: false, error: 'No rep_id found' }

  // Create stopsheet
  const { data: stopsheet, error: stopsheetError } = await supabase
    .from('stopsheets')
    .insert({
      rep_id: userData.rep_id,
      dealer_id: dealerId,
      travel_stop_id: travelStopId || null,
      visit_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single()

  if (stopsheetError) {
    console.error('Failed to create stopsheet:', stopsheetError)
    return { success: false, error: 'Failed to create stopsheet' }
  }

  // Get template items and copy them
  const { data: templates } = await supabase
    .from('stopsheet_templates')
    .select('*')
    .eq('rep_id', userData.rep_id)
    .eq('is_active', true)
    .order('section')
    .order('sort_order')

  if (templates && templates.length > 0) {
    const items = templates.map(t => ({
      stopsheet_id: stopsheet.id,
      template_item_id: t.id,
      section: t.section,
      label: t.label,
      sort_order: t.sort_order
    }))

    const { error: itemsError } = await supabase
      .from('stopsheet_items')
      .insert(items)

    if (itemsError) {
      console.error('Failed to create stopsheet items:', itemsError)
    }
  }

  revalidatePath('/stopsheet')
  return { success: true, stopsheetId: stopsheet.id }
}

export async function getStopSheet(id: string): Promise<StopSheet | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stopsheets')
    .select(`
      *,
      dealer:dealers(id, dealer_name, account_number),
      items:stopsheet_items(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch stopsheet:', error)
    return null
  }

  // Sort items by section and sort_order
  if (data.items) {
    data.items.sort((a: StopSheetItem, b: StopSheetItem) => {
      if (a.section !== b.section) {
        return a.section === 'basics' ? -1 : 1
      }
      return a.sort_order - b.sort_order
    })
  }

  return data as StopSheet
}

export async function getRecentStopSheets(limit: number = 10): Promise<StopSheet[]> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return []

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData?.rep_id) return []

  const { data, error } = await supabase
    .from('stopsheets')
    .select(`
      *,
      dealer:dealers(id, dealer_name, account_number),
      items:stopsheet_items(id, is_checked)
    `)
    .eq('rep_id', userData.rep_id)
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch recent stopsheets:', error)
    return []
  }

  return data as StopSheet[]
}

export async function toggleStopSheetItem(
  itemId: string,
  isChecked: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stopsheet_items')
    .update({ is_checked: isChecked })
    .eq('id', itemId)

  if (error) {
    console.error('Failed to toggle item:', error)
    return { success: false, error: 'Failed to update item' }
  }

  return { success: true }
}

export async function updateStopSheetItemNotes(
  itemId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stopsheet_items')
    .update({ notes: notes.trim() || null })
    .eq('id', itemId)

  if (error) {
    console.error('Failed to update item notes:', error)
    return { success: false, error: 'Failed to update notes' }
  }

  return { success: true }
}

export async function completeStopSheet(
  id: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stopsheets')
    .update({
      status: 'completed',
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to complete stopsheet:', error)
    return { success: false, error: 'Failed to complete stopsheet' }
  }

  revalidatePath('/stopsheet')
  revalidatePath(`/stopsheet/${id}`)
  return { success: true }
}

export async function unlockStopSheet(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stopsheets')
    .update({
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to unlock stopsheet:', error)
    return { success: false, error: 'Failed to unlock stopsheet' }
  }

  revalidatePath('/stopsheet')
  revalidatePath(`/stopsheet/${id}`)
  return { success: true }
}
