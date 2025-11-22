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

    // Market Segments (engaged + active + note)
    retail: rawData.retail === 'on',
    retail_active: rawData.retail_active === 'on',
    retail_note: rawData.retail_note as string || null,
    builder_dealer_controlled: rawData.builder_dealer_controlled === 'on',
    builder_dealer_controlled_active: rawData.builder_dealer_controlled_active === 'on',
    builder_dealer_controlled_note: rawData.builder_dealer_controlled_note as string || null,
    builder_national_spec: rawData.builder_national_spec === 'on',
    builder_national_spec_active: rawData.builder_national_spec_active === 'on',
    builder_national_spec_note: rawData.builder_national_spec_note as string || null,
    commercial_negotiated: rawData.commercial_negotiated === 'on',
    commercial_negotiated_active: rawData.commercial_negotiated_active === 'on',
    commercial_negotiated_note: rawData.commercial_negotiated_note as string || null,
    commercial_spec_bids: rawData.commercial_spec_bids === 'on',
    commercial_spec_bids_active: rawData.commercial_spec_bids_active === 'on',
    commercial_spec_bids_note: rawData.commercial_spec_bids_note as string || null,
    wholesale_to_installers: rawData.wholesale_to_installers === 'on',
    wholesale_to_installers_active: rawData.wholesale_to_installers_active === 'on',
    wholesale_to_installers_note: rawData.wholesale_to_installers_note as string || null,
    multifamily_replacement: rawData.multifamily_replacement === 'on',
    multifamily_replacement_active: rawData.multifamily_replacement_active === 'on',
    multifamily_replacement_note: rawData.multifamily_replacement_note as string || null,
    multifamily_new: rawData.multifamily_new === 'on',
    multifamily_new_active: rawData.multifamily_new_active === 'on',
    multifamily_new_note: rawData.multifamily_new_note as string || null,

    // Stocking (stocks + active + note)
    stocking_wpc: rawData.stocking_wpc === 'on',
    stocking_wpc_active: rawData.stocking_wpc_active === 'on',
    stocking_wpc_note: rawData.stocking_wpc_note as string || null,
    stocking_spc: rawData.stocking_spc === 'on',
    stocking_spc_active: rawData.stocking_spc_active === 'on',
    stocking_spc_note: rawData.stocking_spc_note as string || null,
    stocking_wood: rawData.stocking_wood === 'on',
    stocking_wood_active: rawData.stocking_wood_active === 'on',
    stocking_wood_note: rawData.stocking_wood_note as string || null,
    stocking_specials: rawData.stocking_specials === 'on',
    stocking_specials_active: rawData.stocking_specials_active === 'on',
    stocking_specials_note: rawData.stocking_specials_note as string || null,
    stocking_pad: rawData.stocking_pad === 'on',
    stocking_pad_active: rawData.stocking_pad_active === 'on',
    stocking_pad_note: rawData.stocking_pad_note as string || null,
    stocking_rev_ply: rawData.stocking_rev_ply === 'on',
    stocking_rev_ply_active: rawData.stocking_rev_ply_active === 'on',
    stocking_rev_ply_note: rawData.stocking_rev_ply_note as string || null,

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
  revalidatePath('/dealers')
}
