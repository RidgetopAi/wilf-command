'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface MobileCollapsibleProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function MobileCollapsible({ title, children, defaultOpen = false }: MobileCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-left"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDown 
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  )
}
