'use client'

import { useState } from 'react'
import { MapPin, Plus, Check } from 'lucide-react'
import type { Territory } from '@/types'

interface TerritorySelectorProps {
  id?: string
  territories: Territory[]
  selectedId: string | null
  onSelect: (territoryId: string | null) => void
  onCreateTerritory?: (name: string) => Promise<void>
}

export function TerritorySelector({ 
  id,
  territories, 
  selectedId, 
  onSelect,
  onCreateTerritory 
}: TerritorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const selectedTerritory = territories.find(t => t.id === selectedId)

  const handleSelect = (id: string | null) => {
    onSelect(id)
    setIsOpen(false)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !onCreateTerritory) return
    
    await onCreateTerritory(newName.trim())
    setNewName('')
    setIsAdding(false)
  }

  return (
    <div className="relative">
      <button
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border transition-colors"
        style={{
          backgroundColor: selectedTerritory ? `${selectedTerritory.color}20` : 'transparent',
          borderColor: selectedTerritory?.color || '#d1d5db',
          color: selectedTerritory?.color || '#6b7280'
        }}
      >
        <MapPin className="h-3 w-3" />
        {selectedTerritory?.name || 'Set territory'}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-gray-500">No territory</span>
              {!selectedId && <Check className="h-4 w-4 text-blue-600" />}
            </button>
            
            {territories.map(territory => (
              <button
                key={territory.id}
                onClick={() => handleSelect(territory.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: territory.color }}
                  />
                  {territory.name}
                </span>
                {selectedId === territory.id && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            ))}

            {onCreateTerritory && (
              <>
                <div className="border-t border-gray-100 my-1" />
                {isAdding ? (
                  <form onSubmit={handleAddSubmit} className="px-2 py-1">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Territory name..."
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add territory
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
