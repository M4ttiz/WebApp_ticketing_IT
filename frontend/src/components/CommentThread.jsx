import React from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { MessageSquare, EyeOff, Paperclip } from 'lucide-react'
import { cn } from '../lib/utils'

export default function CommentThread({ messages, currentUserId, currentUserRole }) {
  if (!messages || messages.length === 0) {
    return <div className="text-sm text-text-secondary">Nessun messaggio</div>
  }

  const visibleMessages =
    currentUserRole === 'user' ? messages.filter((msg) => !msg.isInternal) : messages

  return (
    <div className="space-y-4">
      {visibleMessages.map((msg) => {
        const isMine = msg.authorId === currentUserId
        return (
          <div key={msg.id} className={cn('flex gap-3', isMine ? 'flex-row-reverse' : 'flex-row')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-text-primary ring-1 ring-border-subtle">
              {msg.author?.firstName?.[0]}
              {msg.author?.lastName?.[0]}
            </div>
            <div
              className={cn(
                'max-w-[min(100%,520px)] rounded-ds px-4 py-3 ring-1 ring-inset',
                msg.isInternal
                  ? 'bg-surface-hover/80 ring-border-subtle'
                  : isMine
                    ? 'bg-accent/10 ring-accent/25'
                    : 'bg-surface-card ring-border-subtle'
              )}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-text-primary">
                  {msg.author?.firstName} {msg.author?.lastName}
                </span>
                {msg.isInternal && (
                  <span className="inline-flex items-center gap-1 rounded-ds-sm border border-semantic-warning/30 bg-semantic-warning/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-semantic-warning">
                    <EyeOff size={10} aria-hidden /> Nota interna
                  </span>
                )}
                <span className="ml-auto text-[10px] text-text-secondary">
                  {format(new Date(msg.createdAt), 'dd MMM HH:mm', { locale: it })}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{msg.content}</div>
              {msg.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload/uploads/${att.filename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-ds-sm border border-border-subtle bg-surface-main px-2 py-1 text-xs text-text-secondary transition-colors hover:border-border-muted hover:text-text-primary"
                    >
                      <Paperclip size={12} aria-hidden /> {att.originalName}
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
