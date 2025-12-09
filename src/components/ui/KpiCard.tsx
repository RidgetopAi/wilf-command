type KpiTone = 'primary' | 'success' | 'warning' | 'critical' | 'neutral'

interface KpiCardProps {
  label: string
  value: string | number
  tone?: KpiTone
  subtitle?: string
  className?: string
}

const toneClasses: Record<KpiTone, { border: string; value: string }> = {
  primary: { border: 'border-l-indigo-500', value: 'text-indigo-600' },
  success: { border: 'border-l-emerald-500', value: 'text-emerald-600' },
  warning: { border: 'border-l-amber-500', value: 'text-amber-600' },
  critical: { border: 'border-l-rose-500', value: 'text-rose-600' },
  neutral: { border: 'border-l-gray-300', value: 'text-gray-900' },
}

export function KpiCard({ label, value, tone = 'neutral', subtitle, className = '' }: KpiCardProps) {
  const colors = toneClasses[tone]
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 ${colors.border} ${className}`}>
      <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${colors.value}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
