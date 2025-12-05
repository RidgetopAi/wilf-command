import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllReps, getManagerStats } from '@/lib/api/manager'
import Link from 'next/link'

export default async function ManagerDashboard(props: {
  searchParams: Promise<{ repId?: string }>
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify Manager Role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'manager') {
    return <div className="p-8 text-red-600">Access Denied: Manager privileges required.</div>
  }

  const reps = await getAllReps()
  const stats = await getManagerStats(searchParams.repId)

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">Filter by Rep:</span>
          <div className="flex space-x-2">
            <Link 
              href="/manager" 
              className={`px-3 py-1 rounded-md text-sm ${!searchParams.repId ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </Link>
            {reps.map(rep => (
              <Link
                key={rep.id}
                href={`/manager?repId=${rep.rep_id}`}
                className={`px-3 py-1 rounded-md text-sm ${searchParams.repId === rep.rep_id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {rep.full_name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Dealers</h3>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalDealers}</div>
        </div>
        
        {/* Placeholder for other aggregate stats */}
        <div className="bg-white p-6 rounded-lg shadow opacity-50">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total YTD Sales</h3>
          <div className="mt-2 text-3xl font-bold text-gray-900">$0.00</div>
          <span className="text-xs text-gray-400">(Coming Soon)</span>
        </div>

        <div className="bg-white p-6 rounded-lg shadow opacity-50">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Adura Mix (Avg)</h3>
          <div className="mt-2 text-3xl font-bold text-gray-900">0.0%</div>
          <span className="text-xs text-gray-400">(Coming Soon)</span>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h2>
        <p className="text-gray-500">Select a Rep above to view their specific dashboard.</p>
      </div>
    </div>
  )
}
