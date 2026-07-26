import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dzdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatDZD(value: number | string): string {
  const number = typeof value === 'string' ? Number(value.replace(/,/g, '')) : value

  if (Number.isNaN(number)) return '0.00'

  return dzdFormatter.format(number)
}
