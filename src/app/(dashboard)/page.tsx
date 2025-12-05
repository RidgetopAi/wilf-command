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
  const { data: profile } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.id)
    .single()

  if (!profile?.rep_id) {
    // Fallback: try by email
    const { data: emailProfile } = await supabase
      .from('users')
      .select('rep_id')
      .eq('email', user.email)
      .single()

    if (!emailProfile?.rep_id) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Unable to load your rep profile. Please contact support.</p>
        </div>
      )
    }

    return <CommandDashboard repId={emailProfile.rep_id} />
  }

  return <CommandDashboard repId={profile.rep_id} />
}
