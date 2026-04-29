import React from 'react'
import { cn } from '../lib/utils'

const PRIORITY_MAP = {
  BASSA: { label: 'Bassa', className: 'bg-semantic-success/15 text-semantic-success border-semantic-success/25' },
  MEDIA: { label: 'Media', className: 'bg-accent/15 text-accent border-accent/25' },
  ALTA: { label: 'Alta', className: 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/25' },
  CRITICA: { label: 'Critica', className: 'bg-semantic-danger/15 text-semantic-danger border-semantic-danger/25' },
}

export default function PriorityBadge({ priority, className }) {
  const config = PRIORITY_MAP[priority] || {
    label: priority,
    className: 'bg-text-disabled/15 text-text-secondary border-border-subtle',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
