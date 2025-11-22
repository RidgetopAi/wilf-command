import { getDealers } from '@/lib/api/dealers'
import { DealerTable } from '@/components/dealers/DealerTable'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/skeletons'

export const dynamic = 'force-dynamic'

export default async function DealersPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">My Dealers</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all dealers in your territory including their account number, program status, and buying group.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <a
            href="/upload"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Upload CSV
          </a>
        </div>
      </div>
      
      <div className="mt-8">
        <Suspense fallback={<LoadingSpinner />}>
          <DealerList />
        </Suspense>
      </div>
    </div>
  )
}

async function DealerList() {
  const dealers = await getDealers()
  return <DealerTable dealers={dealers} />
}
