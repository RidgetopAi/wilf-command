'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Store, Upload, Shield } from 'lucide-react'

interface MobileTabBarProps {
  isManager?: boolean
}

export function MobileTabBar({ isManager = false }: MobileTabBarProps) {
  const pathname = usePathname()

  const items = [
    { href: '/', label: 'Command', icon: LayoutDashboard },
    { href: '/dealers', label: 'Dealers', icon: Store },
    { href: '/upload', label: 'Upload', icon: Upload },
    ...(isManager ? [{ href: '/manager', label: 'Manager', icon: Shield }] : []),
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 sm:hidden z-50 safe-area-bottom">
      <div className="flex justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs ${active ? 'font-medium' : ''}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
