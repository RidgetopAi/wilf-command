import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ObjectivesDashboard } from '@/components/objectives/ObjectivesDashboard'

export const dynamic = 'force-dynamic'

export default async function ObjectivesPage() {
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

  return <ObjectivesDashboard repId={profile.rep_id} />
}
