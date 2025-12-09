import { Dealer } from '@/types'
import { createClient } from '@/lib/supabase/server'

export async function getDealers(): Promise<Dealer[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .order('dealer_name', { ascending: true })

  if (error) {
    console.error('Error fetching dealers:', error)
    return []
  }

  return data as Dealer[]
}

export async function getDealerById(id: string): Promise<Dealer | null> {
  const supabase = await createClient()
  
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
