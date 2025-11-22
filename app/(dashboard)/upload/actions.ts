'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRepId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  console.log('Auth User:', user.email, user.id)

  // 1. Check for User by ID
  const { data, error } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.id)
    .single()
    
  if (data) {
    console.log('Found by ID:', data.rep_id)
    return data.rep_id
  } else {
    console.log('Not found by ID. Error:', error?.message)
  }

  // 2. Fallback: Check by Email if ID mismatch
  // This handles cases where public.users.id != auth.users.id
  if (user.email) {
    const { data: emailData, error: emailError } = await supabase
      .from('users')
      .select('rep_id')
      .eq('email', user.email)
      .single()
      
    if (emailData) {
      console.log('Found by Email:', emailData.rep_id)
      return emailData.rep_id
    } else {
      console.log('Not found by Email. Error:', emailError?.message)
    }
  }

  console.error('Error fetching rep_id: Both ID and Email lookup failed')
  return null
}
