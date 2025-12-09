export type StatusState = 'ours' | 'engaged' | 'both' | 'none' | 'gap'

interface StatusBadgeProps {
  state: StatusState
  size?: 'sm' | 'md'
  showLabel?: boolean
}

const stateConfig: Record<StatusState, { label: string; className: string; dotColor: string }> = {
  ours: {
    label: 'Ours',
    className: 'bg-emerald-100 text-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  engaged: {
    label: 'Engaged',
    className: 'bg-amber-100 text-amber-800',
    dotColor: 'bg-amber-500',
  },
  both: {
    label: 'Ours + Engaged',
    className: 'bg-indigo-100 text-indigo-800',
    dotColor: 'bg-indigo-500',
  },
  gap: {
    label: 'Gap',
    className: 'bg-rose-100 text-rose-800',
    dotColor: 'bg-rose-500',
  },
  none: {
    label: 'No Position',
    className: 'bg-gray-100 text-gray-600',
    dotColor: 'bg-gray-400',
  },
}

export function StatusBadge({ state, size = 'sm', showLabel = true }: StatusBadgeProps) {
  const config = stateConfig[state]
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  if (!showLabel) {
    return (
      <span
        className={`inline-block rounded-full ${dotSize} ${config.dotColor}`}
        title={config.label}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium ${sizeClasses} ${config.className}`}
    >
      <span className={`rounded-full ${dotSize} ${config.dotColor}`} />
      {config.label}
    </span>
  )
}

export function getStatusState(engaged: boolean, active: boolean): StatusState {
  if (engaged && active) return 'both'
  if (active) return 'ours'
  if (engaged) return 'engaged'
  return 'none'
}
