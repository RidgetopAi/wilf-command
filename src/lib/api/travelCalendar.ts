import { createClient } from '@/lib/supabase/server'
import type { Territory, TravelDay, TravelStop, CreateTravelStopInput, UpdateTravelStopInput } from '@/types'

// =============================================
// TERRITORIES
// =============================================

export async function getTerritories(): Promise<Territory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('territories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching territories:', error)
    return []
  }

  return data as Territory[]
}

export async function createTerritory(name: string, color?: string): Promise<Territory | null> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData) return null

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
    console.error('Error creating territory:', error)
    return null
  }

  return data as Territory
}

// =============================================
// TRAVEL DAYS
// =============================================

export async function getTravelDaysForRange(
  startDate: string,
  endDate: string
): Promise<TravelDay[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('travel_days')
    .select(`
      *,
      territory:territories(*),
      stops:travel_stops(
        *,
        dealer:dealers(id, dealer_name, account_number)
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (error) {
    console.error('Error fetching travel days:', error)
    return []
  }

  // Sort stops by sort_order
  return (data || []).map(day => ({
    ...day,
    stops: day.stops?.sort((a: TravelStop, b: TravelStop) => a.sort_order - b.sort_order) || []
  })) as TravelDay[]
}

export async function getOrCreateTravelDay(date: string): Promise<TravelDay | null> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.user.id)
    .single()

  if (!userData) return null

  // Try to get existing
  const { data: existing } = await supabase
    .from('travel_days')
    .select(`
      *,
      territory:territories(*),
      stops:travel_stops(
        *,
        dealer:dealers(id, dealer_name, account_number)
      )
    `)
    .eq('date', date)
    .single()

  if (existing) {
    return {
      ...existing,
      stops: existing.stops?.sort((a: TravelStop, b: TravelStop) => a.sort_order - b.sort_order) || []
    } as TravelDay
  }

  // Create new
  const { data, error } = await supabase
    .from('travel_days')
    .insert({
      rep_id: userData.rep_id,
      date
    })
    .select(`
      *,
      territory:territories(*),
      stops:travel_stops(
        *,
        dealer:dealers(id, dealer_name, account_number)
      )
    `)
    .single()

  if (error) {
    console.error('Error creating travel day:', error)
    return null
  }

  return data as TravelDay
}

export async function updateTravelDay(
  id: string,
  updates: { territory_id?: string | null; notes?: string }
): Promise<TravelDay | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('travel_days')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      territory:territories(*),
      stops:travel_stops(
        *,
        dealer:dealers(id, dealer_name, account_number)
      )
    `)
    .single()

  if (error) {
    console.error('Error updating travel day:', error)
    return null
  }

  return data as TravelDay
}

// =============================================
// TRAVEL STOPS
// =============================================

export async function createTravelStop(input: CreateTravelStopInput): Promise<TravelStop | null> {
  const supabase = await createClient()

  // Get max sort_order for this day
  const { data: maxOrder } = await supabase
    .from('travel_stops')
    .select('sort_order')
    .eq('travel_day_id', input.travel_day_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxOrder?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('travel_stops')
    .insert({
      ...input,
      sort_order: input.sort_order ?? nextOrder
    })
    .select(`
      *,
      dealer:dealers(id, dealer_name, account_number)
    `)
    .single()

  if (error) {
    console.error('Error creating travel stop:', error)
    return null
  }

  return data as TravelStop
}

export async function updateTravelStop(
  id: string,
  updates: UpdateTravelStopInput
): Promise<TravelStop | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('travel_stops')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      dealer:dealers(id, dealer_name, account_number)
    `)
    .single()

  if (error) {
    console.error('Error updating travel stop:', error)
    return null
  }

  return data as TravelStop
}

export async function deleteTravelStop(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('travel_stops')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting travel stop:', error)
    return false
  }

  return true
}

export async function reorderTravelStops(
  travelDayId: string,
  stopIds: string[]
): Promise<boolean> {
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
    console.error('Error reordering travel stops')
    return false
  }

  return true
}
