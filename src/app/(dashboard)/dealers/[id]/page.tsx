import { getDealerById } from '@/lib/api/dealers'
import { getDisplays, getDealerDisplays } from '@/lib/api/displays'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductMixDashboard } from '@/components/product-mix/ProductMixDashboard'
import { Settings, FileText, ClipboardCheck, BarChart3, MapPin, Phone, User } from 'lucide-react'

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
          {/* Contact Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            {dealer.city && dealer.state && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {dealer.city}, {dealer.state}
              </span>
            )}
            {dealer.phone && (
              <a href={`tel:${dealer.phone}`} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                <Phone className="h-3.5 w-3.5" />
                {dealer.phone}
              </a>
            )}
            {dealer.contact_name && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {dealer.contact_name}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Link
            href={`/dealers/${dealer.id}/notes`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FileText className="h-4 w-4" />
            Notes
          </Link>
          <Link
            href={`/stopsheet/new?dealerId=${dealer.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 border border-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <ClipboardCheck className="h-4 w-4" />
            StopSheet
          </Link>
          <Link
            href={`/dealers/${dealer.id}/product-groups`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 border border-amber-600 rounded-md shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <BarChart3 className="h-4 w-4" />
            Products
          </Link>
          <Link
            href={`/dealers/${dealer.id}/attributes`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
