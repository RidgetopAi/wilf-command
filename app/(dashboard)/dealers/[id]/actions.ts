'use server'

import { createClient } from '@/lib/supabase/server'
import { Dealer } from '@/types'
import { revalidatePath } from 'next/cache'

export async function updateDealer(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const rawData = Object.fromEntries(formData.entries())
  
  const payload: Partial<Dealer> = {
    location_count: Number(rawData.location_count),
    ew_program: rawData.ew_program as string || null,
    buying_group: rawData.buying_group as string || null,
    notes: rawData.notes as string || null,
    
    // Market Segments
    retail: rawData.retail === 'on',
    builder_dealer_controlled: rawData.builder_dealer_controlled === 'on',
    builder_national_spec: rawData.builder_national_spec === 'on',
    commercial_negotiated: rawData.commercial_negotiated === 'on',
    commercial_spec_bids: rawData.commercial_spec_bids === 'on',
    wholesale_to_installers: rawData.wholesale_to_installers === 'on',
    multifamily_replacement: rawData.multifamily_replacement === 'on',
    multifamily_new: rawData.multifamily_new === 'on',
    
    // Stocking
    stocking_wpc: rawData.stocking_wpc === 'on',
    stocking_spc: rawData.stocking_spc === 'on',
    stocking_wood: rawData.stocking_wood === 'on',
    stocking_specials: rawData.stocking_specials === 'on',
    stocking_pad: rawData.stocking_pad === 'on',
    stocking_rev_ply: rawData.stocking_rev_ply === 'on',
    
    last_updated: new Date().toISOString()
  }

  const { error } = await supabase
    .from('dealers')
    .update(payload)
    .eq('id', id)

  if (error) {
    console.error('Update failed:', error)
    throw new Error('Failed to update dealer')
  }

  revalidatePath(`/dealers/${id}`)
}
