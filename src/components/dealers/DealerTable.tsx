'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dealer } from '@/types'
import { Search, ChevronRight } from 'lucide-react'

interface DealerTableProps {
  dealers: Dealer[]
}

function getActiveIndicators(dealer: Dealer) {
  const segments = []
  const stocking = []

  if (dealer.retail_active) segments.push('R')
  if (dealer.builder_dealer_controlled_active) segments.push('BD')
  if (dealer.builder_national_spec_active) segments.push('BN')
  if (dealer.commercial_negotiated_active) segments.push('CN')
  if (dealer.commercial_spec_bids_active) segments.push('CS')
  if (dealer.wholesale_to_installers_active) segments.push('W')
  if (dealer.multifamily_replacement_active) segments.push('MR')
  if (dealer.multifamily_new_active) segments.push('MN')

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
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search dealers..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500 whitespace-nowrap">
          {filteredDealers.length} dealers
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-2">
        {filteredDealers.map((dealer) => {
          const { segments, stocking } = getActiveIndicators(dealer)
          return (
            <Link key={dealer.id} href={`/dealers/${dealer.id}`}>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-100 active:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-indigo-600 truncate">
                      {dealer.dealer_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {dealer.account_number}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {dealer.ew_program || '-'} · {dealer.buying_group || '-'}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
                
                {(segments.length > 0 || stocking.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {segments.map(s => (
                      <span key={s} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        {s}
                      </span>
                    ))}
                    {stocking.map(s => (
                      <span key={s} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block shadow overflow-hidden border-b border-gray-200 rounded-lg">
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
                <span className="text-emerald-600">Ours (Segments)</span>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-emerald-600">Ours (Stocking)</span>
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
                          <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
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
                          <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
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

      {/* Legend - Desktop only */}
      <div className="hidden sm:block text-xs text-gray-500 space-y-1">
        <div><strong>Segments:</strong> R=Retail, BD=Builder(Dealer), BN=Builder(National), CN=Commercial(Neg), CS=Commercial(Spec), W=Wholesale, MR=Multifamily(Repl), MN=Multifamily(New)</div>
        <div><strong>Stocking:</strong> WPC, SPC, Wood, Spec=Specials, Pad, Rev=RevPly</div>
      </div>
    </div>
  )
}
