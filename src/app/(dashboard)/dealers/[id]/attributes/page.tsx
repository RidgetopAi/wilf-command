import { getDealerById } from '@/lib/api/dealers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DealerForm } from '@/components/dealers/DealerForm'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DealerAttributesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const dealer = await getDealerById(params.id)

  if (!dealer) {
    notFound()
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dealers/${dealer.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dealer
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{dealer.dealer_name}</h1>
        <p className="text-sm text-gray-500">Account #{dealer.account_number} - Attributes</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dealer Attributes</h2>
          <DealerForm dealer={dealer} />
        </div>
      </div>
    </div>
  )
}
