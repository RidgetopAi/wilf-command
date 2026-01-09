'use client'

import { Plus } from 'lucide-react'

interface AddNoteFabProps {
  onClick: () => void
}

export function AddNoteFab({ onClick }: AddNoteFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
      aria-label="Add note"
    >
      <Plus className="w-6 h-6" />
    </button>
  )
}
