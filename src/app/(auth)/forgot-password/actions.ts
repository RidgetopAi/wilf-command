'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  if (!email?.trim()) {
    return redirect('/forgot-password?message=Email is required')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    console.error('Password reset error:', error.message)
    return redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`)
  }

  // Always show success message (don't reveal if email exists or not)
  redirect('/forgot-password?success=true')
}
