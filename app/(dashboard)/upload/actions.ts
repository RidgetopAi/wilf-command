'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRepId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // Ideally we fetch the rep_id from the public.users table
  const { data, error } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.id)
    .single()
    
  if (error || !data) {
    console.error('Error fetching rep_id:', error)
    return null
  }
  
  return data.rep_id
}
