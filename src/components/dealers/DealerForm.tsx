'use client'

import { Dealer, Display, DisplayCategory } from '@/types'
import { useUpdateDealer, useUpdateDealerDisplays } from '@/lib/hooks'
import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'

interface DealerFormProps {
  dealer: Dealer
  displays?: Display[]
  selectedDisplayCodes?: string[]
}

interface CategoryItemProps {
  keyName: string
  label: string
  engaged: boolean
  active: boolean
  note: string | null
}

function CategoryItem({ keyName, label, engaged, active, note }: CategoryItemProps) {
  const [isEngaged, setIsEngaged] = useState(engaged)
  const [isActive, setIsActive] = useState(active)

  const isOurs = isActive
  const isGap = isEngaged && !isActive

  const getBorderStyle = () => {
    if (isOurs) return 'bg-emerald-50 border-2 border-emerald-500'
    if (isGap) return 'bg-amber-50 border-2 border-amber-400'
    return 'border border-gray-200'
  }

  return (
    <div className={`rounded-lg p-4 space-y-3 ${getBorderStyle()}`}>
      <div className="text-sm font-medium text-gray-900">{label}</div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 min-h-[44px]">
          <input
            id={keyName}
            name={keyName}
            type="checkbox"
            defaultChecked={engaged}
            onChange={(e) => setIsEngaged(e.target.checked)}
            className="focus:ring-amber-500 h-5 w-5 text-amber-500 border-gray-300 rounded"
          />
          <span className="text-sm text-amber-700">Engaged</span>
        </label>
        <label className="flex items-center gap-2 min-h-[44px]">
          <input
            id={`${keyName}_active`}
            name={`${keyName}_active`}
            type="checkbox"
            defaultChecked={active}
            onChange={(e) => setIsActive(e.target.checked)}
            className="focus:ring-emerald-500 h-5 w-5 text-emerald-600 border-gray-300 rounded"
          />
          <span className="text-sm text-emerald-600 font-medium">Ours</span>
        </label>
      </div>
      <input
        type="text"
        name={`${keyName}_note`}
        defaultValue={note || ''}
        placeholder="Note..."
        className="block w-full text-sm border border-gray-200 rounded py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  )
}

const CATEGORY_LABELS: Record<DisplayCategory, string> = {
  adura: 'Adura',
  laminate: 'Laminate',
  wood: 'Wood',
  somerset: 'Somerset',
  bjelin: 'Bjelin',
  lauzon: 'Lauzon',
  ns_resp: 'NS & Resp',
  sheet: 'Sheet (LVS)'
}

const CATEGORY_ORDER: DisplayCategory[] = ['adura', 'wood', 'laminate', 'ns_resp', 'somerset', 'lauzon', 'bjelin', 'sheet']

function DisplaySelector({
  displays,
  selectedCodes,
  onSelectionChange
}: {
  displays: Display[]
  selectedCodes: string[]
  onSelectionChange: (codes: string[]) => void
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<DisplayCategory>>(new Set())

  const displaysByCategory = displays.reduce((acc, display) => {
    if (!acc[display.category]) acc[display.category] = []
    acc[display.category].push(display)
    return acc
  }, {} as Record<DisplayCategory, Display[]>)

  const toggleCategory = (category: DisplayCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const toggleDisplay = (code: string) => {
    if (selectedCodes.includes(code)) {
      onSelectionChange(selectedCodes.filter(c => c !== code))
    } else {
      onSelectionChange([...selectedCodes, code])
    }
  }

  const getSelectedCountForCategory = (category: DisplayCategory) => {
    return displaysByCategory[category]?.filter(d => selectedCodes.includes(d.code)).length || 0
  }

  return (
    <div className="space-y-2">
      {CATEGORY_ORDER.map(category => {
        const categoryDisplays = displaysByCategory[category]
        if (!categoryDisplays || categoryDisplays.length === 0) return null

        const isExpanded = expandedCategories.has(category)
        const selectedCount = getSelectedCountForCategory(category)

        return (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
            >
              <span className="font-medium text-gray-900">
                {CATEGORY_LABELS[category]}
                {selectedCount > 0 && (
                  <span className="ml-2 text-sm text-emerald-600">({selectedCount} selected)</span>
                )}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {isExpanded && (
              <div className="p-3 space-y-1 bg-white">
                {categoryDisplays.map(display => {
                  const isSelected = selectedCodes.includes(display.code)
                  return (
                    <button
                      key={display.code}
                      type="button"
                      onClick={() => toggleDisplay(display.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="font-mono text-xs text-gray-500 w-6">{display.code}</span>
                      <span className="flex-1 truncate">{display.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function DealerForm({ dealer, displays = [], selectedDisplayCodes = [] }: DealerFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const updateDealer = useUpdateDealer()
  const updateDisplays = useUpdateDealerDisplays()
  const [selectedDisplays, setSelectedDisplays] = useState<string[]>(selectedDisplayCodes)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Update dealer attributes
    updateDealer.mutate(
      { id: dealer.id, formData },
      {
        onError: () => {
          alert('Failed to save changes')
        },
      }
    )

    // Update displays if displays were provided (only on attributes page)
    if (displays.length > 0) {
      updateDisplays.mutate(
        { dealerId: dealer.id, displayCodes: selectedDisplays },
        {
          onError: () => {
            alert('Failed to save displays')
          },
        }
      )
    }
  }

  const isSaving = updateDealer.isPending || updateDisplays.isPending
  const isSaved = updateDealer.isSuccess && (displays.length === 0 || updateDisplays.isSuccess)

  const marketSegments: [string, string][] = [
    ['retail', 'Retail'],
    ['builder_dealer_controlled', 'Builder (Dealer Controlled)'],
    ['builder_national_spec', 'Builder (National Spec)'],
    ['commercial_negotiated', 'Commercial (Negotiated)'],
    ['commercial_spec_bids', 'Commercial (Spec Bids)'],
    ['wholesale_to_installers', 'Wholesale to Installers'],
    ['multifamily_replacement', 'Multifamily (Replacement)'],
    ['multifamily_new', 'Multifamily (New)'],
  ]

  const stockingCategories: [string, string][] = [
    ['stocking_wpc', 'WPC'],
    ['stocking_spc', 'SPC'],
    ['stocking_wood', 'Wood'],
    ['stocking_specials', 'Specials'],
    ['stocking_pad', 'Pad'],
    ['stocking_rev_ply', 'RevPly'],
  ]

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700"># Loc</label>
          <input
            type="number"
            name="location_count"
            defaultValue={dealer.location_count}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">EW Prog.</label>
          <input
            type="text"
            name="ew_program"
            defaultValue={dealer.ew_program || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Buy Group</label>
          <input
            type="text"
            name="buying_group"
            defaultValue={dealer.buying_group || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Display Fixtures */}
        {displays.length > 0 && (
          <div className="sm:col-span-6 pt-4 border-t border-gray-200">
            <fieldset>
              <legend className="text-base font-medium text-gray-900 mb-2">
                Display Fixtures
                {selectedDisplays.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({selectedDisplays.length} selected)
                  </span>
                )}
              </legend>
              <DisplaySelector
                displays={displays}
                selectedCodes={selectedDisplays}
                onSelectionChange={setSelectedDisplays}
              />
            </fieldset>
          </div>
        )}

        {/* Market Segments */}
        <div className="sm:col-span-6">
          <fieldset>
            <legend className="text-base font-medium text-gray-900 mb-2">
              Market Segments
            </legend>
            <div className="grid grid-cols-1 gap-3">
              {marketSegments.map(([key, label]) => (
                <CategoryItem
                  key={key}
                  keyName={key}
                  label={label}
                  engaged={!!dealer[key as keyof Dealer]}
                  active={!!dealer[`${key}_active` as keyof Dealer]}
                  note={dealer[`${key}_note` as keyof Dealer] as string | null}
                />
              ))}
            </div>
          </fieldset>
        </div>

        {/* Stocking Profile */}
        <div className="sm:col-span-6 pt-4 border-t border-gray-200">
          <fieldset>
            <legend className="text-base font-medium text-gray-900 mb-2">
              Stocking Profile
            </legend>
            <div className="grid grid-cols-1 gap-3">
              {stockingCategories.map(([key, label]) => (
                <CategoryItem
                  key={key}
                  keyName={key}
                  label={label}
                  engaged={!!dealer[key as keyof Dealer]}
                  active={!!dealer[`${key}_active` as keyof Dealer]}
                  note={dealer[`${key}_note` as keyof Dealer] as string | null}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700">General Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={dealer.notes || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="ml-3 inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 min-h-[44px]"
          >
            {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
