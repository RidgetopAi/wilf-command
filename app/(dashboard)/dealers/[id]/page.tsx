import { getDealerById } from '@/lib/api/dealers'
import { notFound } from 'next/navigation'
import { DealerForm } from '@/components/dealers/DealerForm'
import { ProductMixDashboard } from '@/components/product-mix/ProductMixDashboard'

export const dynamic = 'force-dynamic'

export default async function DealerDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const dealer = await getDealerById(params.id)

  if (!dealer) {
    notFound()
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{dealer.dealer_name}</h1>
        <p className="text-sm text-gray-500">Account #{dealer.account_number} - v3</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dealer Attributes Form */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dealer Attributes</h2>
              <DealerForm dealer={dealer} />
           </div>
        </div>

        {/* Right Column: Product Mix Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dealer Summary */}
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

          <div className="bg-white shadow rounded-lg p-6">
             <h2 className="text-lg font-medium text-gray-900 mb-4">Product Mix Analytics</h2>
             <ProductMixDashboard
               repId={dealer.rep_id}
               accountNumber={dealer.account_number}
             />
          </div>
        </div>
      </div>
    </div>
  )
}
