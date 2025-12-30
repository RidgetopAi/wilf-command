import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OpportunitiesDashboard } from '@/components/dashboard/OpportunitiesDashboard'

export const dynamic = 'force-dynamic'

export default async function OpportunitiesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('rep_id')
    .eq('id', user.id)
    .single()

  if (!profile?.rep_id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User profile not found.</p>
      </div>
    )
  }

  return <OpportunitiesDashboard repId={profile.rep_id} />
}
