import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import TicketTimeline from '../components/TicketTimeline'
import CommentThread from '../components/CommentThread'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/ui/Button'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../lib/roles'
import { getAssets } from '../api/assets'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ui, cn } from '../lib/utils'
import {
  ArrowLeft,
  MessageSquare,
  Send,
  EyeOff,
  Paperclip,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Trash2,
} from 'lucide-react'

const STATUS_FLOW = {
  APERTO: [
    { value: 'IN_LAVORAZIONE', label: 'Prendi in carico', icon: Clock, color: 'bg-semantic-warning hover:bg-amber-600' },
    { value: 'RIFIUTATO', label: 'Rifiuta', icon: XCircle, color: 'bg-semantic-danger hover:bg-red-600' },
  ],
  IN_LAVORAZIONE: [
    { value: 'IN_ATTESA', label: 'Metti in attesa', icon: Clock, color: 'bg-semantic-warning hover:bg-amber-600' },
    { value: 'RISOLTO', label: 'Risolvi', icon: CheckCircle2, color: 'bg-semantic-success hover:bg-emerald-600' },
  ],
  IN_ATTESA: [
    { value: 'IN_LAVORAZIONE', label: 'Riprendi lavorazione', icon: Clock, color: 'bg-semantic-warning hover:bg-amber-600' },
    { value: 'CHIUSO', label: 'Chiudi', icon: Lock, color: 'bg-text-disabled hover:bg-slate-600' },
  ],
  RISOLTO: [
    { value: 'CHIUSO', label: 'Chiudi definitivamente', icon: Lock, color: 'bg-text-disabled hover:bg-slate-600' },
    { value: 'APERTO', label: 'Riapri', icon: RotateCcw, color: 'bg-accent hover:bg-accent-hover' },
  ],
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const nr = normalizeRole(user?.role)
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [statusModal, setStatusModal] = useState(null)
  const [agents, setAgents] = useState([])
  const [assigneeId, setAssigneeId] = useState('')
  const [assets, setAssets] = useState([])
  const [assetId, setAssetId] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isAdmin = nr === 'admin'
  const isAgent = nr === 'admin' || nr === 'agent'

  useEffect(() => {
    loadTicket()
    if (user?.role === 'admin') {
      api.get('/users?role=technician&limit=100').then((r) => setAgents(r.data.users)).catch(() => {})
    }
    getAssets({ limit: 100 })
      .then((r) => setAssets(r.data.items || []))
      .catch(() => {
        toast.error('Errore nel caricamento asset disponibili')
      })
  }, [id, user?.role])

  async function loadTicket() {
    setLoading(true)
    try {
      const [tRes, mRes] = await Promise.all([api.get(`/tickets/${id}`), api.get(`/tickets/${id}/messages`)])
      setTicket(tRes.data)
      setMessages(mRes.data)
      setAssigneeId(tRes.data.assigneeId || '')
      setAssetId(tRes.data.assets?.[0]?.asset?.id || '')
    } catch (e) {
      toast.error('Errore nel caricamento del ticket')
    } finally {
      setLoading(false)
    }
  }

  async function sendComment() {
    if (!content.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/tickets/${id}/comments`, { content, isInternal })
      setMessages((p) => [...p, res.data])
      setContent('')
      setIsInternal(false)
      toast.success('Commento inviato')
    } catch (e) {
      toast.error("Errore nell'invio del commento")
    } finally {
      setSending(false)
    }
  }

  async function changeStatus(status) {
    try {
      if (status === 'IN_LAVORAZIONE' && isAgent && !ticket.assigneeId) {
        await api.post(`/tickets/${id}/assign`, { assetId: assetId || null })
      }
      await api.patch(`/tickets/${id}/status`, { status })
      toast.success('Stato aggiornato')
      setStatusModal(null)
      loadTicket()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore')
    }
  }

  async function assign() {
    try {
      await api.patch(`/tickets/${id}/assign`, { assigneeId: assigneeId || null, assetId: assetId || null })
      toast.success('Assegnazione aggiornata')
      loadTicket()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore')
    }
  }

  if (loading || !ticket) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-ds bg-surface-hover" />
        <div className="h-64 animate-pulse rounded-ds bg-surface-hover" />
      </div>
    )
  }

  const availableTransitions = STATUS_FLOW[ticket.status] || []

  return (
    <div className={ui.page}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} /> Indietro
      </button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">{ticket.ticketNumber}</h1>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <h2 className="text-lg font-medium text-text-primary">{ticket.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{ticket.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-secondary">
                <span>
                  Categoria: <strong className="text-text-primary">{ticket.category?.name}</strong>
                </span>
                <span>
                  Richiedente:{' '}
                  <strong className="text-text-primary">
                    {ticket.requester?.firstName} {ticket.requester?.lastName}
                  </strong>
                </span>
                <span>
                  Assegnato a:{' '}
                  <strong className="text-text-primary">
                    {ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : '—'}
                  </strong>
                </span>
                <span>
                  Creato:{' '}
                  <strong className="text-text-primary">{format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}</strong>
                </span>
                <span>
                  Asset: <strong className="text-text-primary">{ticket.assets?.[0]?.asset?.name || '—'}</strong>
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
              {isAgent && (
                <div className="flex flex-wrap gap-2">
                  {availableTransitions.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setStatusModal(t)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-ds px-3 py-2 text-sm font-medium text-white transition-colors duration-150',
                        t.color
                      )}
                    >
                      <t.icon size={16} /> {t.label}
                    </button>
                  ))}
                </div>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 rounded-ds border border-semantic-danger/30 bg-semantic-danger/10 px-4 py-2 text-sm font-medium text-semantic-danger transition-colors hover:bg-semantic-danger/20"
                >
                  <Trash2 size={16} /> Elimina ticket
                </button>
              )}
            </div>
          </div>

          {isAgent && (
            <div className={`${ui.cardSection} flex flex-col items-start gap-3`}>
              <UserCheck size={18} className="shrink-0 text-accent" />
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {isAdmin && (
                  <div>
                    <span className="text-sm font-medium text-text-primary">Assegna a:</span>
                    <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={`${ui.select} mt-1`}>
                      <option value="">Non assegnato</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.firstName} {a.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-text-primary">Asset collegato:</span>
                  <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className={`${ui.select} mt-1`}>
                    <option value="">Nessun asset</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} {a.assetTag ? `(${a.assetTag})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {isAdmin && (
                <Button type="button" onClick={assign}>
                  Salva assegnazione
                </Button>
              )}
            </div>
          )}

          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-ds border border-border-subtle bg-surface-card shadow-card">
            <div className="border-b border-border-subtle px-5 py-4">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
                <MessageSquare size={16} className="text-accent" aria-hidden /> Commenti
              </h3>
            </div>
            <div className="max-h-[min(420px,50vh)] flex-1 overflow-y-auto px-5 py-4">
              <CommentThread messages={messages} currentUserId={user?.id} currentUserRole={user?.role} />
            </div>
            <div className="sticky bottom-0 z-10 border-t border-border-subtle bg-surface-main/90 px-5 py-4 backdrop-blur-sm">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Scrivi un commento..."
                rows={3}
                className={`${ui.textarea} resize-none`}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                {isAgent && (
                  <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-border-subtle bg-surface-card text-accent focus:ring-accent/30"
                    />
                    <EyeOff size={14} /> Commento interno
                  </label>
                )}
                <Button type="button" className="ml-auto" disabled={sending || !content.trim()} onClick={sendComment}>
                  {sending ? (
                    'Invio…'
                  ) : (
                    <>
                      <Send size={14} /> Invia
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-6">
          <div className={ui.cardSection}>
            <h3 className="mb-4 text-[15px] font-semibold text-text-primary">Cronologia</h3>
            <TicketTimeline logs={ticket.auditLogs} />
          </div>

          {ticket.attachments?.length > 0 && (
            <div className={ui.cardSection}>
              <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-text-primary">
                <Paperclip size={16} className="text-accent" aria-hidden /> Allegati
              </h3>
              <div className="space-y-2">
                {ticket.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload/uploads/${att.filename}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-accent transition-colors hover:text-accent-hover"
                  >
                    <Paperclip size={14} /> {att.originalName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={!!statusModal}
        title="Conferma cambio stato"
        message={`Vuoi cambiare lo stato del ticket in "${statusModal?.label}"?`}
        onConfirm={() => changeStatus(statusModal?.value)}
        onCancel={() => setStatusModal(null)}
        danger={statusModal?.value === 'RIFIUTATO'}
      />

      <ConfirmModal
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/tickets/${id}`)
            toast.success('Ticket eliminato definitivamente')
            navigate('/tickets')
          } catch (e) {
            toast.error(e.response?.data?.error || "Errore nell'eliminazione ticket")
          } finally {
            setConfirmDelete(false)
          }
        }}
        title="Elimina ticket definitivamente"
        message="Questa azione cancella il ticket anche dal DB. Continuare?"
        confirmText="Conferma eliminazione"
        danger
      />
    </div>
  )
}
