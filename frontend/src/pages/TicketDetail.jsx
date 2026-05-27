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
import { getAssets, getAsset, getAssetOptions } from '../api/assets'
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
  Trash2,
  Search,
  X,
  Package,
  MonitorSmartphone,
  Building2,
  Briefcase,
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
  const [assetId, setAssetId] = useState('')
  const [assetSearch, setAssetSearch] = useState('')
  const [assetResults, setAssetResults] = useState([])
  const [assetSearchLoading, setAssetSearchLoading] = useState(false)
  const [assetLocationFilter, setAssetLocationFilter] = useState('')
  const [assetDepartmentFilter, setAssetDepartmentFilter] = useState('')
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('')
  const [assetFilterOptions, setAssetFilterOptions] = useState({ categories: [], locations: [], departments: [] })
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
      const currentAsset = tRes.data.assets?.[0]?.asset || null
      setAssetId(currentAsset?.id || '')
      if (currentAsset?.id) {
        try {
          const assetRes = await getAsset(currentAsset.id)
          setSelectedAsset(assetRes.data || currentAsset)
        } catch (assetErr) {
          setSelectedAsset(currentAsset)
        }
      } else {
        setSelectedAsset(null)
      }
      setAssetSearch(currentAsset?.name || '')
      setAssetResults([])
    } catch (e) {
      toast.error('Errore nel caricamento del ticket')
    } finally {
      setLoading(false)
    }
  }

  async function loadAssetFilters() {
    try {
      const res = await getAssetOptions()
      setAssetFilterOptions({
        categories: Array.isArray(res.data.categories) ? res.data.categories : [],
        locations: Array.isArray(res.data.locations) ? res.data.locations : [],
        departments: Array.isArray(res.data.departments) ? res.data.departments : [],
      })
    } catch (e) {
      toast.error('Errore nel caricamento dei filtri asset')
    }
  }

  useEffect(() => {
    // When location or category changes, refresh scoped departments
    async function refreshScopedOptions() {
      try {
        const res = await getAssetOptions({ location: assetLocationFilter || undefined, category: assetCategoryFilter || undefined })
        const departments = Array.isArray(res.data.departments) ? res.data.departments : []
        setAssetFilterOptions((p) => ({ ...p, departments }))
        // if current selected department is no longer valid, clear it
        if (assetDepartmentFilter && !departments.includes(assetDepartmentFilter)) {
          setAssetDepartmentFilter('')
        }
      } catch (err) {
        // non-fatal
      }
    }
    refreshScopedOptions()
  }, [assetLocationFilter, assetCategoryFilter])

  useEffect(() => {
    loadTicket()
    loadAssetFilters()
    if (isAdmin) {
      api.get('/users?role=technician&limit=100').then((r) => setAgents(r.data.users)).catch(() => {})
    }
  }, [id])

  useEffect(() => {
    if (!isAgent) return
    const query = assetSearch.trim()
    const shouldSearch = query.length >= 2 || assetLocationFilter || assetDepartmentFilter || assetCategoryFilter

    if (!shouldSearch) {
      setAssetResults([])
      setAssetSearchLoading(false)
      return
    }

    let active = true
    setAssetSearchLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const res = await getAssets({
          search: query || undefined,
          category: assetCategoryFilter || undefined,
          location: assetLocationFilter || undefined,
          department: assetDepartmentFilter || undefined,
          page: 1,
          limit: 10,
        })
        if (active) setAssetResults(res.data.items || [])
      } catch (e) {
        if (active) toast.error('Errore nella ricerca asset')
      } finally {
        if (active) setAssetSearchLoading(false)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [assetSearch, assetLocationFilter, assetDepartmentFilter, assetCategoryFilter, isAgent])

  const resetAssetFilters = () => {
    setAssetLocationFilter('')
    setAssetDepartmentFilter('')
    setAssetCategoryFilter('')
  }

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset)
    setAssetId(asset.id)
    setAssetSearch(asset.name || '')
    setAssetResults([])
  }

  const handleClearAsset = () => {
    setSelectedAsset(null)
    setAssetId('')
    setAssetSearch('')
    setAssetResults([])
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

  async function openAttachment(att) {
    try {
      const res = await api.get(`/upload/${att.filename}`, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: att.mimeType || 'application/octet-stream' }))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = att.originalName || att.filename
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.click()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (e) {
      toast.error('Impossibile aprire allegato')
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
  const linkedAsset = ticket.assets?.[0]?.asset
  const detailedLinkedAsset = selectedAsset?.id === linkedAsset?.id ? selectedAsset : linkedAsset

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

        {isAdmin && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
          >
            <Trash2 size={16} /> Elimina ticket
          </button>
        )}
      </div>

      {/* Admin assign */}
      {isAgent && (
        <div className={`${ui.cardSection} flex flex-col items-start gap-3`}>
          <UserCheck size={18} className="text-primary-400 shrink-0" />
          <div className="w-full space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {isAdmin && (
                <div>
                  <span className="text-sm font-medium">Assegna a:</span>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className={`${ui.select} mt-1`}
                  >
                    <option value="">Non assegnato</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <span className="text-sm font-medium">Filtro sede</span>
                <select
                  value={assetLocationFilter}
                  onChange={(e) => setAssetLocationFilter(e.target.value)}
                  className={`${ui.select} mt-1`}
                >
                  <option value="">Tutte le sedi</option>
                  {assetFilterOptions.locations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-sm font-medium">Filtro reparto</span>
                <select
                  value={assetDepartmentFilter}
                  onChange={(e) => setAssetDepartmentFilter(e.target.value)}
                  className={`${ui.select} mt-1`}
                >
                  <option value="">Tutti i reparti</option>
                  {assetFilterOptions.departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-sm font-medium">Filtro categoria asset</span>
                <select
                  value={assetCategoryFilter}
                  onChange={(e) => setAssetCategoryFilter(e.target.value)}
                  className={`${ui.select} mt-1`}
                >
                  <option value="">Tutte le categorie</option>
                  {assetFilterOptions.categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="relative flex-1">
                <span className="text-sm font-medium">Asset collegato:</span>
                <Search size={16} className="absolute left-3 top-[42px] text-slate-400" />
                <input
                  value={assetSearch}
                  onChange={(e) => {
                    const value = e.target.value
                    setAssetSearch(value)
                    if (selectedAsset && value !== (selectedAsset.name || '')) {
                      setSelectedAsset(null)
                      setAssetId('')
                    }
                  }}
                  placeholder="Cerca asset per nome/modello/sede..."
                  className={`${ui.input} pl-9 pr-9 mt-1 w-full`}
                />
                {(assetId || assetSearch) && (
                  <button
                    type="button"
                    onClick={handleClearAsset}
                    className="absolute right-2 top-[49px] p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/70"
                    aria-label="Deseleziona asset"
                  >
                    <X size={14} />
                  </button>
                )}

                {(assetSearch.trim().length >= 2 || assetLocationFilter || assetDepartmentFilter || assetCategoryFilter) && !selectedAsset && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl max-h-64 overflow-auto">
                    {assetSearchLoading ? (
                      <div className="px-3 py-2 text-sm text-slate-400">Ricerca in corso...</div>
                    ) : assetResults.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">Nessun asset trovato</div>
                    ) : (
                      assetResults.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => handleSelectAsset(a)}
                          className="w-full text-left px-3 py-2 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/70 transition-colors"
                        >
                          <div className="text-sm font-medium text-slate-100">{a.name || '-'}</div>
                          <div className="text-xs text-slate-400">
                            {[a.brand, a.model, a.location, a.assetTag].filter(Boolean).join(' · ') || 'Dettagli non disponibili'}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={resetAssetFilters}
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Reset filtri
              </button>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={assign}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Salva assegnazione
            </button>
          )}
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
          {detailedLinkedAsset && (
            <div className={ui.cardSection}>
              <h3 className="font-semibold text-sm mb-4">Asset collegato</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-200">
                  <Package size={15} className="text-primary-400" />
                  <span>Nome: {detailedLinkedAsset.name || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MonitorSmartphone size={15} className="text-primary-400" />
                  <span>MODELLO: {detailedLinkedAsset.model || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Building2 size={15} className="text-primary-400" />
                  <span>Sede / Ubicazione: {detailedLinkedAsset.location || detailedLinkedAsset.sede || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Briefcase size={15} className="text-primary-400" />
                  <span>Reparto: {detailedLinkedAsset.assignedTo || detailedLinkedAsset.department || detailedLinkedAsset.reparto || '-'}</span>
                </div>
              </div>
            </div>
          )}

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
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => openAttachment(att)}
                    className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <Paperclip size={14} /> {att.originalName}
                  </button>
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

      <ConfirmModal
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/tickets/${id}`)
            toast.success('Ticket eliminato definitivamente')
            navigate('/tickets')
          } catch (e) {
            toast.error(e.response?.data?.error || 'Errore nell\'eliminazione ticket')
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

