'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag } from '@/types'
import { Plus, X, Search } from 'lucide-react'

interface TagPickerProps {
  tags: Tag[]
  selectedIds: string[]
  onToggle: (tagId: string) => void
  onCreate?: (name: string) => Promise<Tag | null>
}

export function TagPicker({ tags, selectedIds, onToggle, onCreate }: TagPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get selected tags for display
  const selectedTags = tags.filter(tag => selectedIds.includes(tag.id))

  // Filter tags based on search query (excluding already selected)
  const filteredTags = tags.filter(tag =>
    !selectedIds.includes(tag.id) &&
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if exact match exists (for "create new" option)
  const exactMatch = tags.find(
    tag => tag.name.toLowerCase() === searchQuery.toLowerCase()
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreate = async () => {
    if (!searchQuery.trim() || !onCreate) return

    setIsCreating(true)
    const tag = await onCreate(searchQuery.trim())
    setIsCreating(false)

    if (tag) {
      onToggle(tag.id)
      setSearchQuery('')
      setIsOpen(false)
    }
  }

  const handleSelectTag = (tagId: string) => {
    onToggle(tagId)
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTags.length > 0) {
        // Select first filtered tag
        handleSelectTag(filteredTags[0].id)
      } else if (searchQuery.trim() && !exactMatch && onCreate) {
        // Create new tag if no match
        handleCreate()
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Selected tags as removable pills */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
            >
              {tag.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              )}
              {tag.name}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search or add tags..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Dropdown suggestions */}
        {isOpen && (searchQuery || filteredTags.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {/* Filtered existing tags */}
            {filteredTags.slice(0, 8).map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelectTag(tag.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                {tag.color && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                )}
                {tag.name}
              </button>
            ))}

            {/* Create new tag option */}
            {searchQuery.trim() && !exactMatch && onCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-indigo-600 border-t border-gray-100"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? 'Creating...' : `Create "${searchQuery.trim()}"`}
              </button>
            )}

            {/* No results message */}
            {filteredTags.length === 0 && !searchQuery.trim() && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Type to search tags
              </div>
            )}
          </div>
        )}
      </div>

      {tags.length === 0 && (
        <p className="text-xs text-gray-500">No tags yet. Type above to create one.</p>
      )}
    </div>
  )
}
