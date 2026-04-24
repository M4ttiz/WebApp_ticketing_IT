import React from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { GitCommit, User, MessageSquare, Tag, ArrowRight } from 'lucide-react'

const ACTION_ICONS = {
  'Ticket creato': GitCommit,
  'Stato cambiato': ArrowRight,
  'Priorità cambiata': Tag,
  'Categoria cambiata': Tag,
  'Ticket assegnato': User,
  'Assegnazione rimossa': User,
  'Ticket preso in carico': User,
  'Commento interno aggiunto': MessageSquare,
  'Commento pubblico aggiunto': MessageSquare,
}

export default function TicketTimeline({ logs }) {
  if (!logs || logs.length === 0) {
    return <div className="text-sm text-slate-400">Nessun aggiornamento</div>
  }

  return (
    <div className="relative pl-6 border-l border-slate-700 space-y-6">
      {logs.map((log) => {
        const Icon = ACTION_ICONS[log.action] || GitCommit
        return (
          <div key={log.id} className="relative">
            <div className="absolute -left-[29px] top-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
              <Icon size={10} className="text-slate-400" />
            </div>
            <div className="text-xs text-slate-500 mb-0.5">
              {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}
            </div>
            <div className="text-sm text-slate-200">
              <span className="font-medium">{log.user?.firstName} {log.user?.lastName}</span>{' '}
              <span className="text-slate-400">{log.action}</span>
            </div>
            {(log.oldValue || log.newValue) && (
              <div className="text-xs text-slate-500 mt-1">
                {log.oldValue && <span>Da: {log.oldValue}</span>}
                {log.oldValue && log.newValue && <span className="mx-1">→</span>}
                {log.newValue && <span>A: {log.newValue}</span>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

