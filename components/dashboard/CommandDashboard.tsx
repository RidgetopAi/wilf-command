'use client'

import { useState, useEffect } from 'react'
import { getTerritoryOverview, TerritoryOverview } from '@/lib/api/productMix'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TerritoryOverview | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const overview = await getTerritoryOverview(repId, year)
        setData(overview)
      } catch (err) {
        console.error('Failed to load territory overview:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [repId, year])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Command Center...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available. Upload your dealer list and monthly sales to get started.</p>
      </div>
    )
  }

  // Prepare chart data
  const categoryData = Object.entries(data.categorySales).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    sales: value,
    orders: data.categoryOrders[key as keyof typeof data.categoryOrders] || 0
  }))

  const pieData = categoryData.map((item, index) => ({
    name: item.name,
    value: item.sales,
    color: COLORS[index % COLORS.length]
  }))

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Sales YTD</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalSales)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.totalOrders)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Quantity</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(Math.round(data.totalQty))}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Active Dealers</p>
          <p className="text-2xl font-bold text-gray-900">{data.dealerCount}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Mix Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Mix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} fontSize={12} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="sales" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  {data.totalSales > 0 ? ((cat.sales / data.totalSales) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Dealers */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
            {data.topDealers.map((dealer, index) => (
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
            {data.topDealers.length === 0 && (
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
  )
}
