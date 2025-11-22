import { createClient } from '@/lib/supabase/client'
import { ProductMixMonthly } from '@/types'

export async function getProductMix(repId: string, accountNumber: string, year: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_mix_monthly')
    .select('*')
    .eq('rep_id', repId)
    .eq('account_number', accountNumber)
    .eq('year', year)
    .order('month', { ascending: true })

  if (error) throw error
  return data as ProductMixMonthly[]
}

export async function getTargets(repId: string, year: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_mix_targets')
    .select('*')
    .eq('rep_id', repId)
    .eq('year', year)
    .single()
    
  if (error && error.code !== 'PGRST116') throw error
  return data
}
