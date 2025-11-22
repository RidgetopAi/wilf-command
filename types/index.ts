export type Role = 'rep' | 'manager'

export interface User {
  id: string
  email: string
  full_name: string
  rep_id: string
  role: Role
  created_at: string
  updated_at: string
}

export interface Dealer {
  id: string
  rep_id: string
  user_id?: string
  account_number: string
  dealer_name: string
  location_count: number
  ew_program: string | null
  buying_group: string | null
  
  // Market Segments (engaged + active with us + note)
  retail: boolean
  retail_active: boolean
  retail_note: string | null
  builder_dealer_controlled: boolean
  builder_dealer_controlled_active: boolean
  builder_dealer_controlled_note: string | null
  builder_national_spec: boolean
  builder_national_spec_active: boolean
  builder_national_spec_note: string | null
  commercial_negotiated: boolean
  commercial_negotiated_active: boolean
  commercial_negotiated_note: string | null
  commercial_spec_bids: boolean
  commercial_spec_bids_active: boolean
  commercial_spec_bids_note: string | null
  wholesale_to_installers: boolean
  wholesale_to_installers_active: boolean
  wholesale_to_installers_note: string | null
  multifamily_replacement: boolean
  multifamily_replacement_active: boolean
  multifamily_replacement_note: string | null
  multifamily_new: boolean
  multifamily_new_active: boolean
  multifamily_new_note: string | null

  // Stocking Categories (stocks + active with us + note)
  stocking_wpc: boolean
  stocking_wpc_active: boolean
  stocking_wpc_note: string | null
  stocking_spc: boolean
  stocking_spc_active: boolean
  stocking_spc_note: string | null
  stocking_wood: boolean
  stocking_wood_active: boolean
  stocking_wood_note: string | null
  stocking_specials: boolean
  stocking_specials_active: boolean
  stocking_specials_note: string | null
  stocking_pad: boolean
  stocking_pad_active: boolean
  stocking_pad_note: string | null
  stocking_rev_ply: boolean
  stocking_rev_ply_active: boolean
  stocking_rev_ply_note: string | null
  
  notes: string | null
  last_updated: string
  created_at: string
}

export interface ProductMixMonthly {
  id: string
  rep_id: string
  account_number: string
  year: number
  month: number

  // Sales
  adura_sales: number
  wood_laminate_sales: number
  sundries_sales: number
  ns_resp_sales: number
  sheet_sales: number

  // Quantity
  adura_qty: number
  wood_laminate_qty: number
  sundries_qty: number
  ns_resp_qty: number
  sheet_qty: number

  // Orders
  adura_orders: number
  wood_laminate_orders: number
  sundries_orders: number
  ns_resp_orders: number
  sheet_orders: number

  // Percentages
  adura_pct: number
  wood_laminate_pct: number
  sundries_pct: number
  ns_resp_pct: number
  sheet_pct: number

  total_sales: number
  total_qty: number
  total_orders: number

  created_at: string
  updated_at: string
}

export interface ProductMixTarget {
  id: string
  rep_id: string
  year: number
  adura_target: number
  wood_laminate_target: number
  sundries_target: number
  ns_resp_target: number
  sheet_target: number
  created_at: string
  updated_at: string
}
