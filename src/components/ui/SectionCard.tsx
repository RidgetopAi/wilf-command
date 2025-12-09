interface SectionCardProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className = '',
  noPadding = false,
}: SectionCardProps) {
  return (
    <section className={`bg-white rounded-lg shadow ${className}`}>
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-medium text-gray-900 sm:text-lg">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 sm:text-sm">{subtitle}</p>}
        </div>
        {actions}
      </header>
      <div className={noPadding ? '' : 'px-4 sm:px-6 py-4'}>{children}</div>
    </section>
  )
}
