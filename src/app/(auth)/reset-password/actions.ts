'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || password.length < 8) {
    return redirect('/reset-password?message=Password must be at least 8 characters')
  }

  if (password !== confirmPassword) {
    return redirect('/reset-password?message=Passwords do not match')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    console.error('Password update error:', error.message)
    return redirect(`/reset-password?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=Password updated successfully. Please log in.')
}
