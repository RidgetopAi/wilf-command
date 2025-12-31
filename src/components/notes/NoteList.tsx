'use client'

import { Note } from '@/types'
import { NoteCard } from './NoteCard'
import { FileText } from 'lucide-react'

interface NoteListProps {
  notes: Note[]
  onNoteClick?: (note: Note) => void
  emptyMessage?: string
  showDealer?: boolean
}

export function NoteList({ notes, onNoteClick, emptyMessage, showDealer }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">
          {emptyMessage || 'No notes yet'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={() => onNoteClick?.(note)}
          showDealer={showDealer}
        />
      ))}
    </div>
  )
}
