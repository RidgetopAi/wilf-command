import Link from 'next/link'

export default function ProductMixPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Product Mix Dashboard</h1>
      <p className="text-gray-600">
        To view product mix, select a dealer from the <Link href="/dealers" className="text-indigo-600 hover:underline">Dealer List</Link>.
      </p>
      <p className="text-sm text-gray-500">
        (Global rep-level analytics will be added here in Phase 4)
      </p>
    </div>
  )
}
