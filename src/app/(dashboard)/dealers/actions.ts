'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createDealer(formData: FormData) {
  const supabase = await createClient()

  // Get current user's rep_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.id)
    .single()

  if (!profile?.rep_id) {
    return redirect('/dealers?error=No rep profile found')
  }

  const dealerName = (formData.get('dealer_name') as string)?.trim()
  const accountNumber = (formData.get('account_number') as string)?.trim()
  const locationCount = parseInt(formData.get('location_count') as string) || 1
  const ewProgram = (formData.get('ew_program') as string)?.trim() || null
  const buyingGroup = (formData.get('buying_group') as string)?.trim() || null

  // Validation
  if (!dealerName) {
    return redirect('/dealers/new?error=Dealer name is required')
  }
  if (!accountNumber) {
    return redirect('/dealers/new?error=Account number is required')
  }

  // Check for duplicate account number for this rep
  const { data: existing } = await supabase
    .from('dealers')
    .select('id')
    .eq('rep_id', profile.rep_id)
    .eq('account_number', accountNumber)
    .single()

  if (existing) {
    return redirect(`/dealers/new?error=Account number ${accountNumber} already exists`)
  }

  // Insert new dealer
  const { error } = await supabase
    .from('dealers')
    .insert({
      rep_id: profile.rep_id,
      dealer_name: dealerName,
      account_number: accountNumber,
      location_count: locationCount,
      ew_program: ewProgram,
      buying_group: buyingGroup,
      last_updated: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to create dealer:', error)
    return redirect(`/dealers/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dealers')
  redirect('/dealers')
}
