'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTerritory(name: string, color?: string) {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: 'Not authenticated' }

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData) return { success: false, error: 'User not found' }

  const { data, error } = await supabase
    .from('territories')
    .insert({
      rep_id: userData.rep_id,
      name,
      color: color || '#3b82f6'
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/travel-calendar')
  return { success: true, territory: data }
}

export async function updateTravelDay(
  date: string,
  updates: { territory_id?: string | null; notes?: string }
) {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: 'Not authenticated' }

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData) return { success: false, error: 'User not found' }

  // Upsert: create if not exists, update if exists
  const { data, error } = await supabase
    .from('travel_days')
    .upsert({
      rep_id: userData.rep_id,
      date,
      ...updates,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'rep_id,date'
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/travel-calendar')
  return { success: true, travelDay: data }
}

export async function addTravelStop(
  date: string,
  dealerId: string,
  scheduledTime?: string
) {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: 'Not authenticated' }

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData) return { success: false, error: 'User not found' }

  // Get or create travel day
  let { data: travelDay } = await supabase
    .from('travel_days')
    .select('id')
    .eq('rep_id', userData.rep_id)
    .eq('date', date)
    .single()

  if (!travelDay) {
    const { data: newDay, error: dayError } = await supabase
      .from('travel_days')
      .insert({
        rep_id: userData.rep_id,
        date
      })
      .select('id')
      .single()

    if (dayError) {
      return { success: false, error: dayError.message }
    }
    travelDay = newDay
  }

  // Get max sort order
  const { data: maxOrder } = await supabase
    .from('travel_stops')
    .select('sort_order')
    .eq('travel_day_id', travelDay.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxOrder?.sort_order ?? -1) + 1

  // Create the stop
  const { data: stop, error } = await supabase
    .from('travel_stops')
    .insert({
      travel_day_id: travelDay.id,
      dealer_id: dealerId,
      scheduled_time: scheduledTime || null,
      sort_order: nextOrder
    })
    .select(`
      *,
      dealer:dealers(id, dealer_name, account_number)
    `)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/travel-calendar')
  return { success: true, stop }
}

export async function updateTravelStop(
  stopId: string,
  updates: {
    scheduled_time?: string
    status?: string
    sort_order?: number
    note_id?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('travel_stops')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', stopId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/travel-calendar')
  return { success: true, stop: data }
}

export async function deleteTravelStop(stopId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('travel_stops')
    .delete()
    .eq('id', stopId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/travel-calendar')
  return { success: true }
}

export async function reorderStops(travelDayId: string, stopIds: string[]) {
  const supabase = await createClient()

  // Update each stop's sort_order
  const updates = stopIds.map((id, index) =>
    supabase
      .from('travel_stops')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('travel_day_id', travelDayId)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    return { success: false, error: 'Failed to reorder stops' }
  }

  revalidatePath('/travel-calendar')
  return { success: true }
}

export async function createVisitNote(
  stopId: string,
  dealerId: string,
  date: string
) {
  const supabase = await createClient()

  // Create a visit note
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      dealer_id: dealerId,
      travel_stop_id: stopId,
      type: 'visit',
      body: '',
      visit_date: date
    })
    .select()
    .single()

  if (noteError) {
    return { success: false, error: noteError.message }
  }

  // Link note to stop
  const { error: stopError } = await supabase
    .from('travel_stops')
    .update({ note_id: note.id, updated_at: new Date().toISOString() })
    .eq('id', stopId)

  if (stopError) {
    return { success: false, error: stopError.message }
  }

  revalidatePath('/travel-calendar')
  return { success: true, noteId: note.id }
}

export async function createEventNote(
  stopId: string,
  eventTitle: string,
  date: string
) {
  const supabase = await createClient()

  // Create an event note (no dealer, linked to the event)
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      dealer_id: null,
      travel_stop_id: stopId,
      type: 'personal',
      title: eventTitle,
      body: '',
      visit_date: date
    })
    .select()
    .single()

  if (noteError) {
    return { success: false, error: noteError.message }
  }

  // Link note to stop
  const { error: stopError } = await supabase
    .from('travel_stops')
    .update({ note_id: note.id, updated_at: new Date().toISOString() })
    .eq('id', stopId)

  if (stopError) {
    return { success: false, error: stopError.message }
  }

  revalidatePath('/travel-calendar')
  return { success: true, noteId: note.id }
}

export async function addCalendarEvent(
  date: string,
  event: {
    event_title: string
    event_type: string
    is_all_day: boolean
    scheduled_time?: string
    end_time?: string
    location?: string
  }
) {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: 'Not authenticated' }

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData) return { success: false, error: 'User not found' }

  // Get or create travel day
  let { data: travelDay } = await supabase
    .from('travel_days')
    .select('id')
    .eq('rep_id', userData.rep_id)
    .eq('date', date)
    .single()

  if (!travelDay) {
    const { data: newDay, error: dayError } = await supabase
      .from('travel_days')
      .insert({
        rep_id: userData.rep_id,
        date
      })
      .select('id')
      .single()

    if (dayError) {
      return { success: false, error: dayError.message }
    }
    travelDay = newDay
  }

  // Get max sort order (all-day events at top, sort_order = 0 for all-day)
  let nextOrder = 0
  if (!event.is_all_day) {
    const { data: maxOrder } = await supabase
      .from('travel_stops')
      .select('sort_order')
      .eq('travel_day_id', travelDay.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()
    nextOrder = (maxOrder?.sort_order ?? -1) + 1
  }

  // Create the event
  const { data: stop, error } = await supabase
    .from('travel_stops')
    .insert({
      travel_day_id: travelDay.id,
      dealer_id: null,
      event_title: event.event_title,
      event_type: event.event_type,
      is_all_day: event.is_all_day,
      scheduled_time: event.scheduled_time || null,
      end_time: event.end_time || null,
      location: event.location || null,
      sort_order: nextOrder
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/travel-calendar')
  return { success: true, stop }
}
