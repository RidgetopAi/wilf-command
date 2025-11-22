import { Dealer } from '@/types'
import { createClient } from '@/lib/supabase/client'

export async function getDealers(): Promise<Dealer[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Fetching dealers for user:', user?.id)

  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .order('dealer_name', { ascending: true })

  if (error) {
    console.error('Error fetching dealers:', error)
    return []
  }

  console.log(`Found ${data?.length || 0} dealers`)
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
