'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dealer } from '@/types'
import { Search } from 'lucide-react'

interface DealerTableProps {
  dealers: Dealer[]
}

// Helper to get active indicators for a dealer
function getActiveIndicators(dealer: Dealer) {
  const segments = []
  const stocking = []

  // Market segments
  if (dealer.retail_active) segments.push('R')
  if (dealer.builder_dealer_controlled_active) segments.push('BD')
  if (dealer.builder_national_spec_active) segments.push('BN')
  if (dealer.commercial_negotiated_active) segments.push('CN')
  if (dealer.commercial_spec_bids_active) segments.push('CS')
  if (dealer.wholesale_to_installers_active) segments.push('W')
  if (dealer.multifamily_replacement_active) segments.push('MR')
  if (dealer.multifamily_new_active) segments.push('MN')

  // Stocking
  if (dealer.stocking_wpc_active) stocking.push('WPC')
  if (dealer.stocking_spc_active) stocking.push('SPC')
  if (dealer.stocking_wood_active) stocking.push('Wood')
  if (dealer.stocking_specials_active) stocking.push('Spec')
  if (dealer.stocking_pad_active) stocking.push('Pad')
  if (dealer.stocking_rev_ply_active) stocking.push('Rev')

  return { segments, stocking }
}

export function DealerTable({ dealers }: DealerTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDealers = dealers.filter(dealer =>
    dealer.dealer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.account_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search dealers or accounts..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500">
          Showing {filteredDealers.length} dealers
        </div>
      </div>

      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dealer
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-red-600">Active Segments</span>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-red-600">Active Stocking</span>
              </th>
              <th scope="col" className="relative px-4 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDealers.map((dealer) => {
              const { segments, stocking } = getActiveIndicators(dealer)
              return (
                <tr key={dealer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link href={`/dealers/${dealer.id}`} className="block">
                      <div className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        {dealer.dealer_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dealer.account_number}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{dealer.ew_program || '-'}</div>
                    <div className="text-xs text-gray-500">{dealer.buying_group || ''}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {segments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {segments.map(s => (
                          <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {stocking.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {stocking.map(s => (
                          <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/dealers/${dealer.id}`} className="text-indigo-600 hover:text-indigo-900">
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 space-y-1">
        <div><strong>Segments:</strong> R=Retail, BD=Builder(Dealer), BN=Builder(National), CN=Commercial(Neg), CS=Commercial(Spec), W=Wholesale, MR=Multifamily(Repl), MN=Multifamily(New)</div>
        <div><strong>Stocking:</strong> WPC, SPC, Wood, Spec=Specials, Pad, Rev=RevPly</div>
      </div>
    </div>
  )
}
