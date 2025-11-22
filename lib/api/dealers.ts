import { Dealer } from '@/types'
import { createClient } from '@/lib/supabase/client'

export async function getDealers(): Promise<Dealer[]> {
  // DEBUG: Temporarily use Service Role to bypass RLS and see if data exists at all
  // Warning: This shows ALL dealers. Only for debugging.
  const supabase = await createClient(true) 
  
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Fetching dealers for user:', user?.id)

  // Manually filter by rep_id since we bypassed RLS
  const { data: userProfile } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user?.id)
    .single()

  if (!userProfile) {
    console.error('User profile not found')
    return []
  }

  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .eq('rep_id', userProfile.rep_id) // Manual filter
    .order('dealer_name', { ascending: true })

  if (error) {
    console.error('Error fetching dealers:', error)
    return []
  }

  console.log(`Found ${data?.length || 0} dealers (Service Role Bypass)`)
  return data as Dealer[]
}

export async function getDealerById(id: string): Promise<Dealer | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching dealer:', error)
    return null
  }

  return data as Dealer
}
