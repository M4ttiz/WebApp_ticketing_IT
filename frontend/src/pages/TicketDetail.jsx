import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import TicketTimeline from '../components/TicketTimeline'
import CommentThread from '../components/CommentThread'
import ConfirmModal from '../components/ConfirmModal'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ui } from '../lib/utils'
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
} from 'lucide-react'

const STATUS_FLOW = {
  APERTO: [
    { value: 'IN_LAVORAZIONE', label: 'Prendi in carico', icon: Clock, color: 'bg-orange-500 hover:bg-orange-600' },
    { value: 'RIFIUTATO', label: 'Rifiuta', icon: XCircle, color: 'bg-rose-500 hover:bg-rose-600' },
  ],
  IN_LAVORAZIONE: [
    { value: 'IN_ATTESA', label: 'Metti in attesa', icon: Clock, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { value: 'RISOLTO', label: 'Risolvi', icon: CheckCircle2, color: 'bg-green-500 hover:bg-green-600' },
  ],
  IN_ATTESA: [
    { value: 'IN_LAVORAZIONE', label: 'Riprendi lavorazione', icon: Clock, color: 'bg-orange-500 hover:bg-orange-600' },
    { value: 'CHIUSO', label: 'Chiudi', icon: Lock, color: 'bg-slate-500 hover:bg-slate-600' },
  ],
  RISOLTO: [
    { value: 'CHIUSO', label: 'Chiudi definitivamente', icon: Lock, color: 'bg-slate-500 hover:bg-slate-600' },
    { value: 'APERTO', label: 'Riapri', icon: RotateCcw, color: 'bg-blue-500 hover:bg-blue-600' },
  ],
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [statusModal, setStatusModal] = useState(null)
  const [agents, setAgents] = useState([])
  const [assigneeId, setAssigneeId] = useState('')

  const isAdmin = user?.role === 'admin'
  const isAgent = user?.role === 'admin' || user?.role === 'technician'

  useEffect(() => {
    loadTicket()
    if (isAdmin) {
      api.get('/users?role=technician&limit=100').then((r) => setAgents(r.data.users)).catch(() => {})
    }
  }, [id])

  async function loadTicket() {
    setLoading(true)
    try {
      const [tRes, mRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/messages`),
      ])
      setTicket(tRes.data)
      setMessages(mRes.data)
      setAssigneeId(tRes.data.assigneeId || '')
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
      toast.error('Errore nell\'invio del commento')
    } finally {
      setSending(false)
    }
  }

  async function changeStatus(status) {
    try {
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
      await api.patch(`/tickets/${id}/assign`, { assigneeId: assigneeId || null })
      toast.success('Assegnazione aggiornata')
      loadTicket()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore')
    }
  }

  if (loading || !ticket) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
        <div className="h-64 bg-slate-700 rounded animate-pulse" />
      </div>
    )
  }

  const availableTransitions = STATUS_FLOW[ticket.status] || []

  return (
    <div className={ui.page}>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Indietro
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{ticket.ticketNumber}</h1>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h2 className="text-lg text-slate-100">{ticket.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{ticket.description}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
            <span>Categoria: <strong className="text-slate-200">{ticket.category?.name}</strong></span>
            <span>Richiedente: <strong className="text-slate-200">{ticket.requester?.firstName} {ticket.requester?.lastName}</strong></span>
            <span>Assegnato a: <strong className="text-slate-200">{ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : '—'}</strong></span>
            <span>Creato: <strong className="text-slate-200">{format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}</strong></span>
          </div>
        </div>

        {/* Actions */}
        {isAgent && (
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusModal(t)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors ${t.color}`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Admin assign */}
      {isAdmin && (
        <div className={`${ui.cardSection} flex flex-col items-start gap-3 sm:flex-row sm:items-center`}>
          <UserCheck size={18} className="text-primary-400 shrink-0" />
          <span className="text-sm font-medium">Assegna a:</span>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className={`${ui.select} flex-1`}
          >
            <option value="">Non assegnato</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
            ))}
          </select>
          <button
            onClick={assign}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Salva
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Comments */}
        <div className="lg:col-span-2 space-y-4">
          <div className={ui.cardSection}>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-400" /> Commenti
            </h3>
            <CommentThread messages={messages} currentUserId={user?.id} currentUserRole={user?.role} />

            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Scrivi un commento..."
                rows={3}
                className={`${ui.textarea} resize-none`}
              />
              <div className="flex items-center justify-between mt-2">
                {isAgent && (
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900 text-primary-500"
                    />
                    <EyeOff size={14} /> Commento interno
                  </label>
                )}
                <button
                  onClick={sendComment}
                  disabled={sending || !content.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors ml-auto"
                >
                  {sending ? 'Invio...' : <><Send size={14} /> Invia</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline + Attachments */}
        <div className="space-y-4">
          <div className={ui.cardSection}>
            <h3 className="font-semibold text-sm mb-4">Cronologia</h3>
            <TicketTimeline logs={ticket.auditLogs} />
          </div>

          {ticket.attachments?.length > 0 && (
            <div className={ui.cardSection}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Paperclip size={16} className="text-primary-400" /> Allegati
              </h3>
              <div className="space-y-2">
                {ticket.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload/uploads/${att.filename}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <Paperclip size={14} /> {att.originalName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!statusModal}
        title={`Conferma cambio stato`}
        message={`Vuoi cambiare lo stato del ticket in "${statusModal?.label}"?`}
        onConfirm={() => changeStatus(statusModal?.value)}
        onCancel={() => setStatusModal(null)}
        danger={statusModal?.value === 'RIFIUTATO'}
      />
    </div>
  )
}

