'use client'

import { Dealer } from '@/types'
import { updateDealer } from '@/app/(dashboard)/dealers/[id]/actions'
import { useState } from 'react'

interface DealerFormProps {
  dealer: Dealer
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

  const bothChecked = isEngaged && isActive

  return (
    <div className={`rounded-lg p-3 space-y-2 ${bothChecked ? 'bg-red-50 border-2 border-red-500' : 'border border-gray-200'}`}>
      <div className="text-sm font-medium text-gray-900">{label}</div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5">
          <input
            id={keyName}
            name={keyName}
            type="checkbox"
            defaultChecked={engaged}
            onChange={(e) => setIsEngaged(e.target.checked)}
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <span className="text-xs text-gray-600">Engaged</span>
        </label>
        <label className="flex items-center gap-1.5">
          <input
            id={`${keyName}_active`}
            name={`${keyName}_active`}
            type="checkbox"
            defaultChecked={active}
            onChange={(e) => setIsActive(e.target.checked)}
            className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
          />
          <span className="text-xs text-red-600 font-medium">Ours</span>
        </label>
      </div>
      <input
        type="text"
        name={`${keyName}_note`}
        defaultValue={note || ''}
        placeholder="Note..."
        className="block w-full text-xs border border-gray-200 rounded py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  )
}

export function DealerForm({ dealer }: DealerFormProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true)
    try {
      await updateDealer(dealer.id, formData)
    } catch (error) {
      alert('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

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
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-4 gap-x-4">
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

        {/* Market Segments */}
        <div className="sm:col-span-6">
          <fieldset>
            <legend className="text-base font-medium text-gray-900 mb-2">
              Market Segments
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
