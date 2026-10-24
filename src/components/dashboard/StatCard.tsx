import React from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  iconColor?: 'blue' | 'green' | 'purple' | 'teal' | 'amber' | 'red'
  badgeText?: string
  badgeVariant?: 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'blue',
  badgeText,
  badgeVariant = 'success',
  className,
}: StatCardProps) {
  const colorMap = {
    blue: 'bg-[#EFF2FE] text-[#4768E8]',
    green: 'bg-[#EBF7EE] text-[#1E8E42]',
    purple: 'bg-[#F4EFFE] text-[#7C3AED]',
    teal: 'bg-[#E6F8F6] text-[#0D9488]',
    amber: 'bg-[#FEF6E8] text-[#C28416]',
    red: 'bg-[#FEECEE] text-[#DE3C4B]',
  }

  const badgeMap = {
    success: 'bg-[#EBF7EE] text-[#1E8E42]',
    warning: 'bg-[#FEF6E8] text-[#C28416]',
    danger: 'bg-[#FEECEE] text-[#DE3C4B]',
    neutral: 'bg-slate-100 text-slate-700',
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#EAE9F2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              colorMap[iconColor]
            )}
          >
            {icon}
          </div>
        )}
        {badgeText && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase',
              badgeMap[badgeVariant]
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-[#64748B]">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-[#192342]">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs font-medium text-[#64748B]">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
