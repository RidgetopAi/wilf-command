'use client'

import { useState } from 'react'
import { useTerritoryOverview, useTerritoryMonthlyMix } from '@/lib/hooks'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { KpiPill, MobileCollapsible } from '@/components/ui'

interface CommandDashboardProps {
  repId: string
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const CATEGORY_LABELS: Record<string, string> = {
  adura: 'Adura',
  woodLaminate: 'Wood & Laminate',
  sundries: 'Sundries',
  nsResp: 'NS & Resp',
  sheet: 'Sheet'
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function CommandDashboard({ repId }: CommandDashboardProps) {
  const [year, setYear] = useState(new Date().getFullYear())
  
  const { 
    data: overview, 
    isLoading: isOverviewLoading, 
    error: overviewError 
  } = useTerritoryOverview(repId, year)
  
  const { 
    data: monthlyMix = [], 
    isLoading: isMixLoading 
  } = useTerritoryMonthlyMix(repId, year)

  const isLoading = isOverviewLoading || isMixLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Command Center...</div>
      </div>
    )
  }

  if (overviewError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">We couldn't load your territory overview.</p>
        <p className="text-sm text-gray-500 mt-2">Check your connection and try again.</p>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available. Upload your dealer list and monthly sales to get started.</p>
      </div>
    )
  }

  const categoryData = Object.entries(overview.categorySales).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    sales: value,
    orders: overview.categoryOrders[key as keyof typeof overview.categoryOrders] || 0
  }))

  const pieData = categoryData.map((item, index) => ({
    name: item.name,
    value: item.sales,
    color: COLORS[index % COLORS.length]
  }))

  const monthlyChartData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((monthName, idx) => {
      const monthNum = idx + 1
      const found = monthlyMix.find(d => d.month === monthNum)
      if (found) {
        return {
          name: monthName,
          Adura: found.adura_pct,
          'Wood & Lam': found.wood_laminate_pct,
          Sundries: found.sundries_pct,
          'NS & Resp': found.ns_resp_pct,
          Sheet: found.sheet_pct
        }
      }
      return {
        name: monthName,
        Adura: 0,
        'Wood & Lam': 0,
        Sundries: 0,
        'NS & Resp': 0,
        Sheet: 0
      }
    })
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
          <p className="text-sm text-gray-500">Territory overview for {year}</p>
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

      {/* Mobile KPI Strip - horizontal scrollable pills */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:hidden">
        <KpiPill label="Penetration" value={`${overview.overallPenetrationPct}%`} tone="success" />
        <KpiPill label="Active" value={`${overview.totalActivePositions}/${overview.totalPossiblePositions}`} tone="neutral" />
        <KpiPill label="Sales YTD" value={formatCurrency(overview.totalSales)} tone="primary" />
        <KpiPill label="Opportunities" value={overview.opportunities.length} tone="warning" />
        <KpiPill label="Dealers" value={overview.dealerCount} tone="neutral" />
      </div>

      {/* Summary Cards - hidden on mobile (shown as pills above) */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Sales YTD</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.totalSales)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalOrders)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Dealers</p>
          <p className="text-2xl font-bold text-gray-900">{overview.dealerCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Active Positions</p>
          <p className="text-2xl font-bold text-gray-900">{overview.totalActivePositions}/{overview.totalPossiblePositions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
          <p className="text-sm font-medium text-gray-500">Penetration</p>
          <p className="text-2xl font-bold text-emerald-600">{overview.overallPenetrationPct}%</p>
        </div>
      </div>

      {/* Mobile: Flex column with order classes | Desktop: Grid layout */}
      <div className="flex flex-col gap-6 sm:contents">
        
        {/* Product Mix Pie Chart - order-1 mobile (high priority) */}
        <div className="order-1 sm:order-none bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Mix</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend layout="horizontal" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Opportunities - order-2 mobile (actionable) */}
        {overview.opportunities.length > 0 && (
          <div className="order-2 sm:order-none bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Opportunities</h3>
              <p className="text-sm text-gray-500">Dealers engaged but not yet active with us</p>
            </div>
            {/* Mobile: Card list */}
            <div className="divide-y divide-gray-200 sm:hidden">
              {overview.opportunities.slice(0, 5).map((opp) => (
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
              {overview.opportunities.length > 5 && (
                <a href="/dealers" className="block px-4 py-3 text-center text-sm text-indigo-600 font-medium">
                  View all {overview.opportunities.length} opportunities →
                </a>
              )}
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

        {/* Penetration Analytics - order-3 mobile */}
        <div className="order-3 sm:order-none grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Sales by Category Bar Chart - order-4 mobile */}
        <div className="order-4 sm:order-none bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales by Category</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={80} fontSize={11} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="sales" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mobile Collapsible: Monthly Mix Trend */}
        <MobileCollapsible title="Monthly Mix Trend">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis unit="%" fontSize={10} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Adura" stackId="a" fill="#4f46e5" />
                  <Bar dataKey="Wood & Lam" stackId="a" fill="#10b981" />
                  <Bar dataKey="Sundries" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="NS & Resp" stackId="a" fill="#ef4444" />
                  <Bar dataKey="Sheet" stackId="a" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </MobileCollapsible>

        {/* Desktop: Monthly Mix Trend */}
        <div className="order-5 hidden sm:block bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Mix Trend (All Dealers)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="Adura" stackId="a" fill="#4f46e5" />
                <Bar dataKey="Wood & Lam" stackId="a" fill="#10b981" />
                <Bar dataKey="Sundries" stackId="a" fill="#f59e0b" />
                <Bar dataKey="NS & Resp" stackId="a" fill="#ef4444" />
                <Bar dataKey="Sheet" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mobile Collapsible: Category Breakdown */}
        <MobileCollapsible title="Category Breakdown">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryData.map((cat, index) => (
                    <tr key={cat.name}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }} />
                          <span className="text-sm text-gray-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(cat.sales)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                        {overview.totalSales > 0 ? ((cat.sales / overview.totalSales) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </MobileCollapsible>

        {/* Desktop: Category Breakdown Table */}
        <div className="order-6 hidden sm:block bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Category Breakdown</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.map((cat, index) => (
                <tr key={cat.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index] }} />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(cat.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatNumber(cat.orders)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {overview.totalSales > 0 ? ((cat.sales / overview.totalSales) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Collapsible: Top Dealers */}
        <MobileCollapsible title="Top 10 Dealers">
          <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
            {overview.topDealers.slice(0, 10).map((dealer, index) => (
              <a key={dealer.account_number} href={`/dealers?account=${dealer.account_number}`} className="block px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 font-medium w-5">{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dealer.dealer_name}</p>
                      <p className="text-xs text-gray-500">{dealer.account_number}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(dealer.total_sales)}</p>
                </div>
              </a>
            ))}
            {overview.topDealers.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500 text-center">No dealer data available yet</p>
            )}
          </div>
        </MobileCollapsible>

        {/* Desktop: Top Dealers */}
        <div className="order-7 hidden sm:block bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top 10 Dealers</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dealer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overview.topDealers.map((dealer, index) => (
                <tr key={dealer.account_number} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{dealer.dealer_name}</div>
                    <div className="text-xs text-gray-500">{dealer.account_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(dealer.total_sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatNumber(dealer.total_orders)}
                  </td>
                </tr>
              ))}
              {overview.topDealers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No dealer data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
