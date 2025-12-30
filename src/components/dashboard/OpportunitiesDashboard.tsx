'use client'

import { useState } from 'react'
import { useTerritoryOverview } from '@/lib/hooks'

interface OpportunitiesDashboardProps {
  repId: string
}

export function OpportunitiesDashboard({ repId }: OpportunitiesDashboardProps) {
  const [year, setYear] = useState(new Date().getFullYear())

  const {
    data: overview,
    isLoading,
    error
  } = useTerritoryOverview(repId, year)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading opportunities...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Couldn't load opportunity data.</p>
        <p className="text-sm text-gray-500 mt-2">Check your connection and try again.</p>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available. Upload your dealer list to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-500">Gaps and penetration analysis for {year}</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Total Opportunities</p>
          <p className="text-2xl font-bold text-amber-600">{overview.opportunities.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Active Positions</p>
          <p className="text-2xl font-bold text-emerald-600">{overview.totalActivePositions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Total Possible</p>
          <p className="text-2xl font-bold text-gray-900">{overview.totalPossiblePositions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
          <p className="text-sm font-medium text-gray-500">Penetration</p>
          <p className="text-2xl font-bold text-emerald-600">{overview.overallPenetrationPct}%</p>
        </div>
      </div>

      {/* Top Opportunities */}
      {overview.opportunities.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Opportunities</h3>
            <p className="text-sm text-gray-500">Dealers engaged but not yet active with us</p>
          </div>
          {/* Mobile: Card list */}
          <div className="divide-y divide-gray-200 sm:hidden">
            {overview.opportunities.map((opp) => (
              <a key={opp.id} href={`/dealers/${opp.id}`} className="block px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">{opp.dealer_name}</p>
                    <p className="text-xs text-gray-500">{opp.account_number}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {opp.categories.length} gaps
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {opp.categories.slice(0, 3).map((cat) => (
                    <span key={cat} className="text-xs text-gray-500">{cat}</span>
                  ))}
                  {opp.categories.length > 3 && <span className="text-xs text-gray-400">+{opp.categories.length - 3}</span>}
                </div>
              </a>
            ))}
          </div>
          {/* Desktop: Table */}
          <table className="hidden sm:table min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opportunity Categories</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"># Gaps</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overview.opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a href={`/dealers/${opp.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                      {opp.dealer_name}
                    </a>
                    <div className="text-xs text-gray-500">{opp.account_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {opp.categories.slice(0, 5).map((cat) => (
                        <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          {cat}
                        </span>
                      ))}
                      {opp.categories.length > 5 && (
                        <span className="text-xs text-gray-500">+{opp.categories.length - 5} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {opp.categories.length}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overview.opportunities.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No opportunities found - great job! All engaged dealers are active with us.</p>
        </div>
      )}

      {/* Penetration Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Segment Penetration */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Market Segment Penetration</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-amber-600 uppercase">Engaged</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-emerald-600 uppercase">Ours</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-rose-500 uppercase">Gap</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.segmentPenetration.map((seg) => (
                  <tr key={seg.label}>
                    <td className="px-4 py-3 text-sm text-gray-900">{seg.label}</td>
                    <td className="px-4 py-3 text-sm text-amber-600 text-center">{seg.engaged}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 text-center font-medium">{seg.active}</td>
                    <td className="px-4 py-3 text-sm text-rose-500 text-center">{seg.gap}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${seg.penetrationPct}%` }} />
                        </div>
                        <span className="text-sm text-gray-900">{seg.penetrationPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stocking Penetration */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Stocking Penetration</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-amber-600 uppercase">Stocks</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-emerald-600 uppercase">Ours</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-rose-500 uppercase">Gap</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.stockingPenetration.map((cat) => (
                  <tr key={cat.label}>
                    <td className="px-4 py-3 text-sm text-gray-900">{cat.label}</td>
                    <td className="px-4 py-3 text-sm text-amber-600 text-center">{cat.engaged}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 text-center font-medium">{cat.active}</td>
                    <td className="px-4 py-3 text-sm text-rose-500 text-center">{cat.gap}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${cat.penetrationPct}%` }} />
                        </div>
                        <span className="text-sm text-gray-900">{cat.penetrationPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
