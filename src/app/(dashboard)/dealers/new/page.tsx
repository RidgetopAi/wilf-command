import { createDealer } from '../actions'
import Link from 'next/link'

export default async function NewDealerPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dealers"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          &larr; Back to Dealers
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Add New Dealer</h1>
          <p className="text-sm text-gray-500 mb-6">
            Manually add a dealer to your territory.
          </p>

          {searchParams?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{searchParams.error}</p>
            </div>
          )}

          <form action={createDealer} className="space-y-6">
            <div>
              <label htmlFor="dealer_name" className="block text-sm font-medium text-gray-700">
                Dealer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="dealer_name"
                name="dealer_name"
                required
                placeholder="ABC Flooring"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="account_number"
                name="account_number"
                required
                placeholder="12345"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Must match the account number in Sales-I</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="location_count" className="block text-sm font-medium text-gray-700">
                  # Locations
                </label>
                <input
                  type="number"
                  id="location_count"
                  name="location_count"
                  min="1"
                  defaultValue="1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="ew_program" className="block text-sm font-medium text-gray-700">
                  EW Program
                </label>
                <input
                  type="text"
                  id="ew_program"
                  name="ew_program"
                  placeholder="Gold"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="buying_group" className="block text-sm font-medium text-gray-700">
                  Buying Group
                </label>
                <input
                  type="text"
                  id="buying_group"
                  name="buying_group"
                  placeholder="Allied"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                href="/dealers"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Dealer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
