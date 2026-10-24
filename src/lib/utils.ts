import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standard Indian Rupee currency format (e.g. ₹42,800.00 or ₹42,800)
 */
export function formatCurrency(amount: number, showDecimals = true): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)
}

/**
 * Compact Indian currency formatting (e.g. ₹2.84Cr, ₹18.6L, ₹42,800) matching Figma screenshots
 */
export function formatCompactINR(amount: number): string {
  if (amount == null || isNaN(amount)) return '₹0'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (abs >= 10000000) {
    // Crore
    const cr = abs / 10000000
    return `${sign}₹${cr.toFixed(2).replace(/\.?0+$/, '')}Cr`
  }
  if (abs >= 100000) {
    // Lakh
    const lakh = abs / 100000
    return `${sign}₹${lakh.toFixed(1).replace(/\.?0+$/, '')}L`
  }
  // Standard formatted without decimals
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`
}

export function formatINR(amount: number): string {
  if (amount == null || isNaN(amount)) return '₹0'
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function formatDate(date: string | Date): string {
  if (!date) return '—'
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return String(date)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

export function getInitials(name: string): string {
  if (!name) return 'CU'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
