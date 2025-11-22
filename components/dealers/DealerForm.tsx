'use client'

import { Dealer } from '@/types'
import { updateDealer } from '@/app/(dashboard)/dealers/[id]/actions'
import { useState } from 'react'

interface DealerFormProps {
  dealer: Dealer
}

export function DealerForm({ dealer }: DealerFormProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true)
    try {
      await updateDealer(dealer.id, formData)
      // Optional: Add toast success
    } catch (error) {
      alert('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700"># Locations</label>
          <input
            type="number"
            name="location_count"
            defaultValue={dealer.location_count}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">EW Program</label>
          <input
            type="text"
            name="ew_program"
            defaultValue={dealer.ew_program || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700">Buying Group</label>
          <input
            type="text"
            name="buying_group"
            defaultValue={dealer.buying_group || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="sm:col-span-6">
           <fieldset>
             <legend className="text-base font-medium text-gray-900">Market Segments</legend>
             <div className="mt-4 grid grid-cols-2 gap-4">
               {[
                 ['retail', 'Retail'],
                 ['builder_dealer_controlled', 'Builder (Controlled)'],
                 ['builder_national_spec', 'Builder (National Spec)'],
                 ['commercial_negotiated', 'Commercial (Negotiated)'],
                 ['commercial_spec_bids', 'Commercial (Spec Bids)'],
                 ['wholesale_to_installers', 'Wholesale to Installers'],
                 ['multifamily_replacement', 'Multifamily (Replacement)'],
                 ['multifamily_new', 'Multifamily (New)'],
               ].map(([key, label]) => (
                 <div key={key} className="flex items-start">
                   <div className="flex items-center h-5">
                     <input
                       id={key}
                       name={key}
                       type="checkbox"
                       defaultChecked={!!dealer[key as keyof Dealer]}
                       className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                     />
                   </div>
                   <div className="ml-3 text-sm">
                     <label htmlFor={key} className="font-medium text-gray-700">{label}</label>
                   </div>
                 </div>
               ))}
             </div>
           </fieldset>
        </div>
        
        <div className="sm:col-span-6 pt-4 border-t border-gray-200">
           <fieldset>
             <legend className="text-base font-medium text-gray-900">Stocking Profile</legend>
             <div className="mt-4 grid grid-cols-2 gap-4">
               {[
                 ['stocking_wpc', 'WPC'],
                 ['stocking_spc', 'SPC'],
                 ['stocking_wood', 'Wood'],
                 ['stocking_specials', 'Specials'],
                 ['stocking_pad', 'Pad'],
                 ['stocking_rev_ply', 'Rev/Ply'],
               ].map(([key, label]) => (
                 <div key={key} className="flex items-start">
                   <div className="flex items-center h-5">
                     <input
                       id={key}
                       name={key}
                       type="checkbox"
                       defaultChecked={!!dealer[key as keyof Dealer]}
                       className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                     />
                   </div>
                   <div className="ml-3 text-sm">
                     <label htmlFor={key} className="font-medium text-gray-700">{label}</label>
                   </div>
                 </div>
               ))}
             </div>
           </fieldset>
        </div>

        <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
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
