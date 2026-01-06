'use client'

import { useState } from 'react'
import { Tag } from '@/types'
import { Plus, X } from 'lucide-react'

interface TagPickerProps {
  tags: Tag[]
  selectedIds: string[]
  onToggle: (tagId: string) => void
  onCreate?: (name: string) => Promise<Tag | null>
}

export function TagPicker({ tags, selectedIds, onToggle, onCreate }: TagPickerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!newTagName.trim() || !onCreate) return

    setIsCreating(true)
    const tag = await onCreate(newTagName.trim())
    setIsCreating(false)

    if (tag) {
      onToggle(tag.id)
      setNewTagName('')
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTagName('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => {
          const isSelected = selectedIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id)}
              className={
                isSelected
                  ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500'
                  : 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            >
              {tag.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              )}
              {tag.name}
              {isSelected && <X className="w-3 h-3" />}
            </button>
          )
        })}

        {/* Add new tag button */}
        {onCreate && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 border border-dashed border-gray-300"
          >
            <Plus className="w-3 h-3" />
            New tag
          </button>
        )}
      </div>

      {/* Inline new tag input */}
      {isAdding && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tag name..."
            autoFocus
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newTagName.trim() || isCreating}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {isCreating ? '...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setNewTagName('')
            }}
            className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}

      {tags.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500">No tags yet. Create your first tag above.</p>
      )}
    </div>
  )
}
