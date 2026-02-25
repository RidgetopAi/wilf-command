import { createClient } from '@/lib/supabase/client'
import { AduraObjective } from '@/types'

export async function getObjectives(repId: string): Promise<AduraObjective[]> {
  const supabase = createClient()

  // 1. Get objectives for this rep
  const { data: objectives, error: objError } = await supabase
    .from('adura_objectives')
    .select('*')
    .eq('rep_id', repId)
    .order('category')
    .order('adura_2025_sales', { ascending: false })

  if (objError) throw objError
  if (!objectives || objectives.length === 0) return []

  // 2. Get dealer names
  const { data: dealers } = await supabase
    .from('dealers')
    .select('id, account_number, dealer_name')
    .eq('rep_id', repId)

  const dealerMap = new Map(
    dealers?.map(d => [d.account_number, { id: d.id, name: d.dealer_name }]) || []
  )

  // 3. Get 2026 YTD adura sales per account
  const { data: mixData } = await supabase
    .from('product_mix_monthly')
    .select('account_number, adura_sales')
    .eq('rep_id', repId)
    .eq('year', 2026)

  const aduraSalesMap = new Map<string, number>()
  for (const row of (mixData || [])) {
    const current = aduraSalesMap.get(row.account_number) || 0
    aduraSalesMap.set(row.account_number, current + (Number(row.adura_sales) || 0))
  }

  // 4. Join
  return objectives.map(obj => {
    const dealer = dealerMap.get(obj.account_number)
    return {
      ...obj,
      adura_2025_sales: Number(obj.adura_2025_sales),
      dealer_name: dealer?.name || obj.account_number,
      dealer_id: dealer?.id,
      adura_2026_sales: aduraSalesMap.get(obj.account_number) || 0
    }
  })
}

export async function togglePresented(objectiveId: string, presented: boolean) {
  const supabase = createClient()

  const { error } = await supabase
    .from('adura_objectives')
    .update({ presented, updated_at: new Date().toISOString() })
    .eq('id', objectiveId)

  if (error) throw error
}
