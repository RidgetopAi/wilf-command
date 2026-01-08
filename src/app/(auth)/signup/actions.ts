'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const ALLOWED_DOMAIN = 'eliaswilf.com'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const repId = formData.get('rep_id') as string

  // Server-side domain validation (critical - don't trust client)
  const emailDomain = email.split('@')[1]?.toLowerCase()
  if (emailDomain !== ALLOWED_DOMAIN) {
    return redirect(`/signup?message=Only @${ALLOWED_DOMAIN} email addresses are allowed`)
  }

  // Validate required fields
  if (!fullName?.trim()) {
    return redirect('/signup?message=Full name is required')
  }
  if (!repId?.trim()) {
    return redirect('/signup?message=Rep ID is required')
  }

  // Password strength check
  if (password.length < 8) {
    return redirect('/signup?message=Password must be at least 8 characters')
  }

  const supabase = await createClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return redirect(`/signup?message=${encodeURIComponent(authError.message)}`)
  }

  if (!authData.user) {
    return redirect('/signup?message=Failed to create account')
  }

  // Use service role to create user profile (new user doesn't have RLS permissions yet)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    return redirect(`/signup?message=${encodeURIComponent('Server configuration error. Contact admin.')}`)
  }

  const supabaseAdmin = await createClient(true)

  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      full_name: fullName.trim(),
      rep_id: repId.trim().toUpperCase(),
      role: 'rep',
    })

  if (profileError) {
    // If profile creation fails, we should clean up the auth user
    // But for now, redirect with error - admin can fix manually
    console.error('Profile creation failed:', profileError.message, profileError.code, profileError.details)
    return redirect(`/signup?message=${encodeURIComponent('Account created but profile setup failed. Contact admin.')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
