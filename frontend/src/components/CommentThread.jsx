import React from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { MessageSquare, EyeOff, Paperclip } from 'lucide-react'
import { cn } from '../lib/utils'

export default function CommentThread({ messages, currentUserId, currentUserRole }) {
  if (!messages || messages.length === 0) {
    return <div className="text-sm text-slate-400">Nessun messaggio</div>
  }

  const visibleMessages =
    currentUserRole === 'user' ? messages.filter((msg) => !msg.isInternal) : messages

  return (
    <div className="space-y-4">
      {visibleMessages.map((msg) => {
        const isMine = msg.authorId === currentUserId
        return (
          <div key={msg.id} className={cn('flex gap-3', isMine ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold shrink-0">
              {msg.author?.firstName?.[0]}{msg.author?.lastName?.[0]}
            </div>
            <div className={cn('max-w-[80%] rounded-xl px-4 py-3', isMine ? 'bg-primary-500/20' : 'bg-slate-700/50')}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-200">
                  {msg.author?.firstName} {msg.author?.lastName}
                </span>
                {msg.isInternal && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                    <EyeOff size={10} /> Interno
                  </span>
                )}
                <span className="text-[10px] text-slate-500 ml-auto">
                  {format(new Date(msg.createdAt), 'dd MMM HH:mm', { locale: it })}
                </span>
              </div>
              <div className="text-sm text-slate-100 whitespace-pre-wrap">{msg.content}</div>
              {msg.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload/uploads/${att.filename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600 transition-colors"
                    >
                      <Paperclip size={12} /> {att.originalName}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

