'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { TemplateItem } from './TemplateItem'
import type { StopSheetTemplate, StopSheetSection } from '@/types'

interface TemplateSectionProps {
  title: string
  section: StopSheetSection
  items: StopSheetTemplate[]
  onAdd: (section: StopSheetSection, label: string) => Promise<void>
  onUpdate: (id: string, label: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder: (section: StopSheetSection, itemIds: string[]) => Promise<void>
}

function TemplateSection({
  title,
  section,
  items,
  onAdd,
  onUpdate,
  onDelete,
  onReorder
}: TemplateSectionProps) {
  const [newItemLabel, setNewItemLabel] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)

    if (oldIndex !== newIndex) {
      const newItems = [...items]
      const [moved] = newItems.splice(oldIndex, 1)
      newItems.splice(newIndex, 0, moved)
      await onReorder(section, newItems.map(i => i.id))
    }
  }

  const handleAdd = async () => {
    if (!newItemLabel.trim()) return
    setIsAdding(true)
    await onAdd(section, newItemLabel.trim())
    setNewItemLabel('')
    setIsAdding(false)
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 mb-3">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-2">No items yet</p>
            ) : (
              items.map(item => (
                <TemplateItem
                  key={item.id}
                  item={item}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItemLabel}
          onChange={(e) => setNewItemLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add new item..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          onClick={handleAdd}
          disabled={!newItemLabel.trim() || isAdding}
          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface TemplateEditorProps {
  items: StopSheetTemplate[]
  onAdd: (section: StopSheetSection, label: string) => Promise<void>
  onUpdate: (id: string, label: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder: (section: StopSheetSection, itemIds: string[]) => Promise<void>
}

export function TemplateEditor({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onReorder
}: TemplateEditorProps) {
  const basicsItems = items.filter(i => i.section === 'basics')
  const objectivesItems = items.filter(i => i.section === 'objectives')

  return (
    <div className="space-y-6">
      <TemplateSection
        title="The Basics"
        section="basics"
        items={basicsItems}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onReorder={onReorder}
      />

      <TemplateSection
        title="Monthly Objectives"
        section="objectives"
        items={objectivesItems}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onReorder={onReorder}
      />
    </div>
  )
}
