import React from 'react'
import { cn } from '../lib/utils'

const STATUS_MAP = {
  APERTO: { label: 'Aperto', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  IN_LAVORAZIONE: { label: 'In lavorazione', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  IN_ATTESA: { label: 'In attesa', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  RISOLTO: { label: 'Risolto', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  CHIUSO: { label: 'Chiuso', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  RIFIUTATO: { label: 'Rifiutato', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function StatusBadge({ status, className }) {
  const config = STATUS_MAP[status] || { label: status, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className, className)}>
      {config.label}
    </span>
  )
}

