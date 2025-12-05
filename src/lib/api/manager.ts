import { createClient } from '@/lib/supabase/server'
import { User } from '@/types'

export async function getAllReps() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'rep')
    .order('full_name')

  if (error) return []
  return data as User[]
}

export async function getManagerStats(repId?: string) {
  const supabase = await createClient()
  
  let query = supabase.from('dealers').select('*', { count: 'exact' })
  
  if (repId) {
    query = query.eq('rep_id', repId)
  }
  
  const { count, error } = await query
  
  return {
    totalDealers: count || 0
  }
}
