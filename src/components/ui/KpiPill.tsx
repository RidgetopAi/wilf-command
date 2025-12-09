type KpiTone = 'primary' | 'success' | 'warning' | 'critical' | 'neutral'

interface KpiPillProps {
  label: string
  value: string | number
  tone?: KpiTone
}

const toneClasses: Record<KpiTone, string> = {
  primary: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  critical: 'bg-rose-50 text-rose-700 border-rose-100',
  neutral: 'bg-gray-50 text-gray-700 border-gray-100',
}

export function KpiPill({ label, value, tone = 'neutral' }: KpiPillProps) {
  return (
    <div className={`min-w-[120px] flex-shrink-0 rounded-lg border px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-[10px] uppercase tracking-wide font-medium opacity-80">{label}</p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
    </div>
  )
}
