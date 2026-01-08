import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommandDashboard } from '@/components/dashboard/CommandDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get rep_id for the user
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.id)
    .single()

  if (!profile?.rep_id) {
    // Fallback: try by email
    const { data: emailProfile, error: emailError } = await supabase
      .from('users')
      .select('rep_id')
      .eq('email', user.email)
      .single()

    if (!emailProfile?.rep_id) {
      console.error('Profile lookup failed for user:', user.id, user.email)
      console.error('By ID error:', profileError?.message, profileError?.code)
      console.error('By email error:', emailError?.message, emailError?.code)
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Unable to load your rep profile. Please contact support.</p>
          <p className="text-gray-500 text-sm mt-2">User ID: {user.id}</p>
        </div>
      )
    }

    return <CommandDashboard repId={emailProfile.rep_id} />
  }

  return <CommandDashboard repId={profile.rep_id} />
}
