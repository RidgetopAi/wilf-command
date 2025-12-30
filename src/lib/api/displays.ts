import { Display, DealerDisplay } from '@/types'
import { createClient } from '@/lib/supabase/server'

export async function getDisplays(): Promise<Display[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('displays')
    .select('*')
    .order('category', { ascending: true })
    .order('code', { ascending: true })

  if (error) {
    console.error('Error fetching displays:', error)
    return []
  }

  return data as Display[]
}

export async function getDealerDisplays(dealerId: string): Promise<DealerDisplay[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dealer_displays')
    .select(`
      *,
      display:displays(*)
    `)
    .eq('dealer_id', dealerId)

  if (error) {
    console.error('Error fetching dealer displays:', error)
    return []
  }

  return data as DealerDisplay[]
}
