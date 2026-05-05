import React from 'react'
import { cn } from '../lib/utils'

const PRIORITY_MAP = {
  BASSA: { label: 'Bassa', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  MEDIA: { label: 'Media', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ALTA: { label: 'Alta', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  CRITICA: { label: 'Critica', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function PriorityBadge({ priority, className }) {
  const config = PRIORITY_MAP[priority] || { label: priority, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className, className)}>
      {config.label}
    </span>
  )
}

