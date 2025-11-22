'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRepId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // 1. Check for User by ID
  const { data, error } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.id)
    .single()
    
  if (data) return data.rep_id

  // 2. Fallback: Check by Email if ID mismatch
  // This handles cases where public.users.id != auth.users.id
  if (user.email) {
    const { data: emailData } = await supabase
      .from('users')
      .select('rep_id')
      .eq('email', user.email)
      .single()
      
    if (emailData) return emailData.rep_id
  }

  console.error('Error fetching rep_id:', error)
  return null
}
