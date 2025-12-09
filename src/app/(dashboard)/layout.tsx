import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isManager = profile?.role === 'manager'

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                   <span className="font-bold text-xl text-indigo-600 cursor-pointer">Wilf Command</span>
                </Link>
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Command
                </Link>
                <Link href="/dealers" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dealers
                </Link>
                <Link href="/upload" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Upload
                </Link>
                {isManager && (
                  <Link href="/manager" className="border-transparent text-indigo-600 hover:border-indigo-300 hover:text-indigo-800 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Manager View
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-sm text-gray-500 mr-4">
                {user.email} {isManager && <span className="ml-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs">Manager</span>}
              </div>
              <form action="/auth/signout" method="post">
                 <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">Sign Out</button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="pb-16 sm:pb-0">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <MobileTabBar isManager={isManager} />
    </div>
  )
}
