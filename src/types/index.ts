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

  // Period tracking for cumulative uploads
  period_start: string | null
  period_end: string | null

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

export type DisplayCategory = 'adura' | 'laminate' | 'wood' | 'somerset' | 'bjelin' | 'lauzon' | 'ns_resp' | 'sheet'

export interface Display {
  code: string
  name: string
  category: DisplayCategory
}

export interface DealerDisplay {
  id: string
  dealer_id: string
  display_code: string
  installed_date: string | null
  notes: string | null
  created_at: string
  display?: Display // Joined display info
}

export type DisplayTimeframe = 'month' | 'ytd' | 'rolling3'

export interface InactiveAduraDealer {
  id: string
  dealer_name: string
  account_number: string
  display_count: number // Number of adura displays assigned
}

// =============================================
// NOTES SYSTEM TYPES
// =============================================

export type NoteType = 
  | 'visit' 
  | 'follow_up' 
  | 'vp' 
  | 'opportunity' 
  | 'plan'
  | 'issue' 
  | 'quote' 
  | 'order' 
  | 'personal'

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  visit: 'Visit',
  follow_up: 'Follow-up',
  vp: 'V.P.',
  opportunity: 'Opportunity',
  plan: 'Plan',
  issue: 'Issue',
  quote: 'Quote',
  order: 'Order',
  personal: 'Personal'
}

export interface Note {
  id: string
  dealer_id: string | null
  travel_stop_id: string | null
  type: NoteType
  title: string | null
  body: string
  visit_date: string
  follow_up_date: string | null
  auto_send_email: boolean
  dealer_email_id: string | null
  email_template_id: string | null
  created_at: string
  updated_at: string
  // Joined data
  tags?: Tag[]
  attachments?: NoteAttachment[]
  dealer?: Dealer
  travel_stop?: TravelStop
}

export interface NoteAttachment {
  id: string
  note_id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  created_at: string
  // Computed
  url?: string
}

export interface Tag {
  id: string
  name: string
  color: string | null
  created_at: string
}

export interface DealerEmail {
  id: string
  dealer_id: string
  label: string | null
  email: string
  is_primary: boolean
  created_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  description: string | null
  subject_template: string
  body_template: string
  default_for_type: NoteType | null
  created_at: string
  updated_at: string
}

export type EmailStatus = 'pending' | 'sent' | 'failed'

export interface NoteEmail {
  id: string
  note_id: string
  template_id: string | null
  dealer_email_id: string | null
  to_addresses: string[]
  subject: string
  body: string
  status: EmailStatus
  error_message: string | null
  sent_at: string | null
  created_at: string
}

// Filter/Input types
export interface NotesFilter {
  dealerId?: string
  travelStopId?: string
  type?: NoteType
  tagIds?: string[]
  startDate?: string
  endDate?: string
  search?: string
}

export interface CreateNoteInput {
  dealer_id?: string | null
  travel_stop_id?: string | null
  type: NoteType
  title?: string
  body: string
  visit_date?: string
  follow_up_date?: string
  tag_ids?: string[]
}

export interface UpdateNoteInput {
  type?: NoteType
  title?: string
  body?: string
  visit_date?: string
  follow_up_date?: string
  travel_stop_id?: string | null
  tag_ids?: string[]
}

// =============================================
// TRAVEL CALENDAR TYPES
// =============================================

export interface Territory {
  id: string
  rep_id: string
  name: string
  color: string
  created_at: string
}

export interface TravelDay {
  id: string
  rep_id: string
  date: string
  territory_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  territory?: Territory
  stops?: TravelStop[]
}

export type TravelStopStatus = 'planned' | 'completed' | 'cancelled' | 'rescheduled'
export type TravelEventType = 'dealer_visit' | 'meeting' | 'event' | 'travel' | 'personal' | 'blocked'

export const EVENT_TYPE_CONFIG: Record<TravelEventType, { label: string; color: string; icon: string }> = {
  dealer_visit: { label: 'Dealer Visit', color: 'blue', icon: 'Store' },
  meeting: { label: 'Meeting', color: 'purple', icon: 'Users' },
  event: { label: 'Event', color: 'green', icon: 'Calendar' },
  travel: { label: 'Travel', color: 'orange', icon: 'Car' },
  personal: { label: 'Personal', color: 'gray', icon: 'User' },
  blocked: { label: 'Blocked', color: 'red', icon: 'Ban' }
}

export interface TravelStop {
  id: string
  travel_day_id: string
  dealer_id: string | null
  scheduled_time: string | null
  duration_minutes: number
  sort_order: number
  status: TravelStopStatus
  note_id: string | null
  // Event fields
  event_title: string | null
  event_type: TravelEventType
  is_all_day: boolean
  end_time: string | null
  location: string | null
  created_at: string
  updated_at: string
  // Joined data
  dealer?: Dealer
  note?: Note
}

export interface CreateTravelStopInput {
  travel_day_id: string
  dealer_id?: string
  scheduled_time?: string
  duration_minutes?: number
  sort_order?: number
  // Event fields
  event_title?: string
  event_type?: TravelEventType
  is_all_day?: boolean
  end_time?: string
  location?: string
}

export interface UpdateTravelStopInput {
  scheduled_time?: string
  duration_minutes?: number
  sort_order?: number
  status?: TravelStopStatus
  note_id?: string
}
