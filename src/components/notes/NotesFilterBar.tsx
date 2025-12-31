'use client'

import { useState } from 'react'
import { NoteType, NOTE_TYPE_LABELS, Tag } from '@/types'
import { Search, Filter, X } from 'lucide-react'

interface NotesFilterBarProps {
  onFilterChange: (filters: NotesFilterState) => void
  tags: Tag[]
  initialFilters?: NotesFilterState
}

export interface NotesFilterState {
  type?: NoteType
  search?: string
  tagIds?: string[]
  dateRange?: 'all' | '7d' | '30d' | '90d'
}

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' }
] as const

const NOTE_TYPES: (NoteType | 'all')[] = [
  'all',
  'visit',
  'follow_up',
  'vp_opportunity',
  'issue',
  'quote',
  'order',
  'personal'
]

export function NotesFilterBar({ onFilterChange, tags, initialFilters }: NotesFilterBarProps) {
  const [filters, setFilters] = useState<NotesFilterState>(initialFilters || {})
  const [showFilters, setShowFilters] = useState(false)

  const updateFilters = (updates: Partial<NotesFilterState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  const hasActiveFilters = filters.type || filters.tagIds?.length || filters.dateRange

  return (
    <div className="space-y-3">
      {/* Search + Filter Toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={filters.search || ''}
            onChange={e => updateFilters({ search: e.target.value || undefined })}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`
            px-3 py-2 border rounded-lg flex items-center gap-2 text-sm
            ${hasActiveFilters 
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {NOTE_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateFilters({ type: type === 'all' ? undefined : type })}
                  className={`
                    px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                    ${(type === 'all' && !filters.type) || filters.type === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {type === 'all' ? 'All' : NOTE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex flex-wrap gap-2">
              {DATE_RANGES.map(range => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => updateFilters({ 
                    dateRange: range.value === 'all' ? undefined : range.value 
                  })}
                  className={`
                    px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                    ${(range.value === 'all' && !filters.dateRange) || filters.dateRange === range.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const isSelected = filters.tagIds?.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const newTagIds = isSelected
                          ? filters.tagIds?.filter(id => id !== tag.id)
                          : [...(filters.tagIds || []), tag.id]
                        updateFilters({ tagIds: newTagIds?.length ? newTagIds : undefined })
                      }}
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors
                        ${isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      {tag.color && (
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: isSelected ? 'white' : tag.color }}
                        />
                      )}
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
