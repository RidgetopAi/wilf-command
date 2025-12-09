import { createClient } from '@/lib/supabase/server'
import { User } from '@/types'

export async function getAllReps(): Promise<User[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'rep')
    .order('full_name')

  if (error) {
    console.error('Error fetching reps:', error.message)
    return []
  }
  return data as User[]
}

export interface ManagerStats {
  totalDealers: number
}

export async function getManagerStats(repId?: string): Promise<ManagerStats> {
  const supabase = await createClient()
  
  let query = supabase.from('dealers').select('*', { count: 'exact' })
  
  if (repId) {
    query = query.eq('rep_id', repId)
  }
  
  const { count, error } = await query
  
  if (error) {
    console.error('Error fetching manager stats:', error.message)
  }
  
  return {
    totalDealers: count || 0
  }
}
