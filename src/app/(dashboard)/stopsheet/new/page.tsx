'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Store, ClipboardCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createStopSheet } from '../actions'

interface DealerOption {
  id: string
  dealer_name: string
  account_number: string
}

export default function NewStopSheetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedDealerId = searchParams.get('dealerId')
  const [dealers, setDealers] = useState<DealerOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')

  const handleSelectDealer = useCallback(async (dealerId: string) => {
    setIsCreating(true)
    const result = await createStopSheet(dealerId)
    if (result.success && result.stopsheetId) {
      router.push(`/stopsheet/${result.stopsheetId}`)
    } else {
      setIsCreating(false)
      alert(result.error || 'Failed to create stopsheet')
    }
  }, [router])

  useEffect(() => {
    // If dealerId is provided, create stopsheet immediately
    if (preselectedDealerId) {
      handleSelectDealer(preselectedDealerId)
      return
    }

    async function loadDealers() {
      const supabase = createClient()

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: userData } = await supabase
        .from('users')
        .select('rep_id')
        .eq('id', user.user.id)
        .single()

      if (!userData?.rep_id) return

      const { data } = await supabase
        .from('dealers')
        .select('id, dealer_name, account_number')
        .eq('rep_id', userData.rep_id)
        .order('dealer_name')

      setDealers(data || [])
      setIsLoading(false)
    }
    loadDealers()
  }, [preselectedDealerId, handleSelectDealer])

  const filteredDealers = useMemo(() => {
    if (!search.trim()) return dealers
    const searchLower = search.toLowerCase()
    return dealers.filter(d =>
      d.dealer_name.toLowerCase().includes(searchLower) ||
      d.account_number.toLowerCase().includes(searchLower)
    )
  }, [dealers, search])

  // Show creating state when pre-selecting dealer
  if (preselectedDealerId || isCreating) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
          <p className="text-sm text-gray-600">Creating stopsheet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/stopsheet"
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-gray-900">Start StopSheet</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dealers..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Dealer List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredDealers.length === 0 ? (
        <div className="text-center py-8">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {search ? 'No dealers match your search' : 'No dealers found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDealers.map(dealer => (
            <button
              key={dealer.id}
              onClick={() => handleSelectDealer(dealer.id)}
              className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all text-left"
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <Store className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {dealer.dealer_name}
                </p>
                <p className="text-xs text-gray-500">{dealer.account_number}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
