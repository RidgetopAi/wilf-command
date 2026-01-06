'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { TemplateEditor } from '@/components/stopsheet/TemplateEditor'
import {
  getTemplateItems,
  createTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
  reorderTemplateItems
} from '../actions'
import type { StopSheetTemplate, StopSheetSection } from '@/types'

export default function StopSheetEditorPage() {
  const [items, setItems] = useState<StopSheetTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadItems = useCallback(async () => {
    const data = await getTemplateItems()
    setItems(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleAdd = async (section: StopSheetSection, label: string) => {
    const result = await createTemplateItem(section, label)
    if (result.success && result.item) {
      setItems(prev => [...prev, result.item!])
    }
  }

  const handleUpdate = async (id: string, label: string) => {
    const result = await updateTemplateItem(id, label)
    if (result.success) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, label } : i))
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteTemplateItem(id)
    if (result.success) {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  const handleReorder = async (section: StopSheetSection, itemIds: string[]) => {
    // Optimistic update
    setItems(prev => {
      const otherItems = prev.filter(i => i.section !== section)
      const reorderedItems = itemIds
        .map((id, index) => {
          const item = prev.find(i => i.id === id)
          return item ? { ...item, sort_order: index } : null
        })
        .filter((i): i is StopSheetTemplate => i !== null)
      return [...otherItems, ...reorderedItems].sort((a, b) => {
        if (a.section !== b.section) return a.section === 'basics' ? -1 : 1
        return a.sort_order - b.sort_order
      })
    })

    await reorderTemplateItems(section, itemIds)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/stopsheet"
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-gray-900">Edit Template</h1>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-600 mb-6">
        Configure your checklist items. These will be copied to each new StopSheet.
        Drag to reorder, click to edit.
      </p>

      {/* Editor */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="h-4 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <TemplateEditor
          items={items}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      )}
    </div>
  )
}
