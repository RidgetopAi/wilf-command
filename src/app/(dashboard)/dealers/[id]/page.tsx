import { getDealerById } from '@/lib/api/dealers'
import { getDisplays, getDealerDisplays } from '@/lib/api/displays'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductMixDashboard } from '@/components/product-mix/ProductMixDashboard'
import { Settings, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DealerDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [dealer, allDisplays, dealerDisplays] = await Promise.all([
    getDealerById(params.id),
    getDisplays(),
    getDealerDisplays(params.id)
  ])

  if (!dealer) {
    notFound()
  }

  // Get full display objects for this dealer
  const dealerDisplayCodes = new Set(dealerDisplays.map(dd => dd.display_code))
  const displays = allDisplays.filter(d => dealerDisplayCodes.has(d.code))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Edit Attributes button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dealer.dealer_name}</h1>
          <p className="text-sm text-gray-500">Account #{dealer.account_number}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dealers/${dealer.id}/notes`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FileText className="h-4 w-4" />
            Notes
          </Link>
          <Link
            href={`/dealers/${dealer.id}/attributes`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Settings className="h-4 w-4" />
            Attributes
          </Link>
        </div>
      </div>

      {/* Dealer Summary Strip */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase"># Loc</p>
            <p className="text-lg font-semibold text-gray-900">{dealer.location_count || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">EW Prog.</p>
            <p className="text-lg font-semibold text-gray-900 truncate">{dealer.ew_program || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Buy Grp</p>
            <p className="text-lg font-semibold text-gray-900 truncate">{dealer.buying_group || '-'}</p>
          </div>
        </div>
      </div>

      {/* Product Mix Analytics - Full Width */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Product Mix Analytics</h2>
        <ProductMixDashboard
          repId={dealer.rep_id}
          accountNumber={dealer.account_number}
          displays={displays}
        />
      </div>
    </div>
  )
}
