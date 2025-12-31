'use client'

import { NoteType, NOTE_TYPE_LABELS } from '@/types'

interface NoteTypeSelectorProps {
  value: NoteType
  onChange: (type: NoteType) => void
}

const NOTE_TYPES: NoteType[] = [
  'visit',
  'follow_up',
  'vp',
  'opportunity',
  'plan',
  'issue',
  'quote',
  'order',
  'personal'
]

export function NoteTypeSelector({ value, onChange }: NoteTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {NOTE_TYPES.map(type => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-colors
            ${value === type
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {NOTE_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  )
}
