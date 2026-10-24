import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'Active' | 'Paid' | 'Pending' | 'Review' | 'Overdue' | 'Inactive' | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase()

  let style = 'bg-slate-100 text-slate-700'

  if (normalized === 'active' || normalized === 'paid') {
    style = 'bg-[#EBF7EE] text-[#1E8E42]'
  } else if (normalized === 'pending' || normalized === 'review') {
    style = 'bg-[#FEF6E8] text-[#C28416]'
  } else if (normalized === 'overdue' || normalized === 'inactive') {
    style = 'bg-[#FEECEE] text-[#DE3C4B]'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      {status}
    </span>
  )
}
