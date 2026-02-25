'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Target, Loader2 } from 'lucide-react'
import { AduraObjective, ObjectiveCategory, OBJECTIVE_CATEGORY_LABELS } from '@/types'
import { getObjectives } from '@/lib/api/objectives'
import { togglePresented } from '@/app/(dashboard)/objectives/actions'
import Link from 'next/link'

interface ObjectivesDashboardProps {
  repId: string
}

const CATEGORY_ORDER: ObjectiveCategory[] = ['up', 'rollback', 'lock_in']

const CATEGORY_STYLES: Record<ObjectiveCategory, {
  bg: string
  border: string
  header: string
  headerText: string
  description: string
}> = {
  up: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    header: 'bg-amber-100',
    headerText: 'text-amber-800',
    description: 'Accounts with Adura displays under performing expectations'
  },
  rollback: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    header: 'bg-blue-100',
    headerText: 'text-blue-800',
    description: 'Rolling pricing back to pre-tariff levels'
  },
  lock_in: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    header: 'bg-emerald-100',
    headerText: 'text-emerald-800',
    description: 'Bought pallet to lock in special pricing'
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function ObjectivesDashboard({ repId }: ObjectivesDashboardProps) {
  const [objectives, setObjectives] = useState<AduraObjective[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const data = await getObjectives(repId)
        setObjectives(data)
      } catch (e) {
        console.error('Failed to load objectives:', e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [repId])

  const handleToggle = async (obj: AduraObjective) => {
    const newPresented = !obj.presented
    setTogglingIds(prev => new Set(prev).add(obj.id))

    // Optimistic update
    setObjectives(prev =>
      prev.map(o => o.id === obj.id ? { ...o, presented: newPresented } : o)
    )

    try {
      await togglePresented(obj.id, newPresented)
    } catch (e) {
      // Revert on error
      setObjectives(prev =>
        prev.map(o => o.id === obj.id ? { ...o, presented: !newPresented } : o)
      )
      console.error('Failed to toggle presented:', e)
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(obj.id)
        return next
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading objectives...</div>
      </div>
    )
  }

  if (objectives.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Objectives</h1>
          <p className="text-sm text-gray-500">Adura activation tracking</p>
        </div>
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <Target className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No objectives loaded yet.</p>
          <p className="text-sm text-gray-400 mt-1">Contact your manager to get your activation list uploaded.</p>
        </div>
      </div>
    )
  }

  // Group by category
  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: OBJECTIVE_CATEGORY_LABELS[cat],
    style: CATEGORY_STYLES[cat],
    items: objectives.filter(o => o.category === cat)
  })).filter(g => g.items.length > 0)

  // Summary stats
  const totalAccounts = objectives.length
  const presentedCount = objectives.filter(o => o.presented).length
  const total2025 = objectives.reduce((sum, o) => sum + o.adura_2025_sales, 0)
  const total2026 = objectives.reduce((sum, o) => sum + (o.adura_2026_sales || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Objectives</h1>
        <p className="text-sm text-gray-500">Adura activation tracking &mdash; present the Adura Story and special pricing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Total Accounts</p>
          <p className="text-2xl font-bold text-gray-900">{totalAccounts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
          <p className="text-sm font-medium text-gray-500">Presented</p>
          <p className="text-2xl font-bold text-emerald-600">
            {presentedCount} <span className="text-sm font-normal text-gray-400">/ {totalAccounts}</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">2025 Adura $</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total2025)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">2026 Adura YTD</p>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(total2026)}</p>
        </div>
      </div>

      {/* Category Groups */}
      {grouped.map(({ category, label, style, items }) => (
        <div key={category} className={`rounded-lg border ${style.border} overflow-hidden`}>
          {/* Category Header */}
          <div className={`${style.header} px-4 py-3 flex items-center justify-between`}>
            <div>
              <h2 className={`text-lg font-semibold ${style.headerText}`}>{label}</h2>
              <p className={`text-sm ${style.headerText} opacity-75`}>{style.description}</p>
            </div>
            <div className={`text-sm font-medium ${style.headerText}`}>
              {items.filter(i => i.presented).length}/{items.length} presented
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`${style.bg} border-b ${style.border}`}>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dealer Name</th>
                  <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Display</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">2025 $</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">2026 YTD</th>
                  <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
                </tr>
              </thead>
              <tbody>
                {items.map((obj, i) => (
                  <tr
                    key={obj.id}
                    className={`${i % 2 === 0 ? style.bg : 'bg-white'} border-b border-gray-100 ${
                      obj.presented ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(obj)}
                        disabled={togglingIds.has(obj.id)}
                        className="focus:outline-none disabled:opacity-50"
                      >
                        {togglingIds.has(obj.id) ? (
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : obj.presented ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 hover:text-gray-500" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-600">{obj.account_number}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {obj.dealer_id ? (
                        <Link href={`/dealers/${obj.dealer_id}`} className="hover:text-indigo-600 hover:underline">
                          {obj.dealer_name}
                        </Link>
                      ) : (
                        obj.dealer_name
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2 text-sm text-gray-500">{obj.display_type}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900 tabular-nums">
                      {formatCurrency(obj.adura_2025_sales)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-indigo-600 tabular-nums">
                      {formatCurrency(obj.adura_2026_sales || 0)}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2 text-sm text-gray-500 max-w-xs truncate">
                      {obj.comments}
                    </td>
                  </tr>
                ))}
                {/* Category subtotal */}
                <tr className={`${style.header} font-medium`}>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className={`px-4 py-2 text-sm ${style.headerText}`}>{label} Total</td>
                  <td className="hidden sm:table-cell px-4 py-2"></td>
                  <td className={`px-4 py-2 text-sm text-right ${style.headerText} tabular-nums`}>
                    {formatCurrency(items.reduce((sum, o) => sum + o.adura_2025_sales, 0))}
                  </td>
                  <td className={`px-4 py-2 text-sm text-right ${style.headerText} tabular-nums`}>
                    {formatCurrency(items.reduce((sum, o) => sum + (o.adura_2026_sales || 0), 0))}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
