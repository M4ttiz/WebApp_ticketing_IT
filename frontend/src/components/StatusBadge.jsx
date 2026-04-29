import React from 'react'
import { cn } from '../lib/utils'

const STATUS_STYLE = {
  APERTO: { label: 'Aperto', dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent/15' },
  IN_LAVORAZIONE: { label: 'In lavorazione', dot: 'bg-semantic-warning', text: 'text-semantic-warning', bg: 'bg-semantic-warning/15', pulse: true },
  IN_ATTESA: { label: 'In attesa', dot: 'bg-text-secondary', text: 'text-text-secondary', bg: 'bg-text-secondary/15' },
  RISOLTO: { label: 'Risolto', dot: 'bg-semantic-success', text: 'text-semantic-success', bg: 'bg-semantic-success/15' },
  CHIUSO: { label: 'Chiuso', dot: 'bg-text-disabled', text: 'text-text-disabled', bg: 'bg-text-disabled/15' },
  RIFIUTATO: { label: 'Rifiutato', dot: 'bg-semantic-danger', text: 'text-semantic-danger', bg: 'bg-semantic-danger/15' },
}

export default function StatusBadge({ status, className }) {
  const config = STATUS_STYLE[status] || {
    label: status,
    dot: 'bg-text-secondary',
    text: 'text-text-secondary',
    bg: 'bg-text-secondary/15',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-ds-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        config.bg,
        config.text,
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', config.dot, config.pulse && 'animate-status-pulse')}
        aria-hidden
      />
      {config.label}
    </span>
  )
}
