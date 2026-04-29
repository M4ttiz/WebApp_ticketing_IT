import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const ui = {
  page: 'space-y-7',
  card:
    'rounded-ds border border-border-subtle/95 bg-surface-card transition-all duration-150 hover:border-border-muted',
  cardSection:
    'rounded-ds border border-border-subtle/95 bg-surface-card p-5 transition-all duration-150 hover:border-border-muted',
  subtleText: 'text-sm text-text-secondary',
  input:
    'w-full rounded-ds border border-border-subtle bg-surface-card px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-disabled focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent/20 shadow-none transition-colors duration-150',
  select:
    'w-full rounded-ds border border-border-subtle bg-surface-card px-3.5 py-2.5 text-[13px] text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors duration-150',
  textarea:
    'w-full rounded-ds border border-border-subtle bg-surface-card px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-disabled focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors duration-150',
  label: 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary',
}
