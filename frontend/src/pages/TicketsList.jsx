import React, { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import { Search, Plus, Filter, X, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ui, cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../lib/roles'

const STATUS_OPTIONS = [
  { value: '', label: 'Tutti' },
  { value: 'APERTO', label: 'Aperto' },
  { value: 'IN_LAVORAZIONE', label: 'In lavorazione' },
  { value: 'IN_ATTESA', label: 'In attesa' },
  { value: 'RISOLTO', label: 'Risolto' },
  { value: 'CHIUSO', label: 'Chiuso' },
  { value: 'RIFIUTATO', label: 'Rifiutato' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'Tutte' },
  { value: 'BASSA', label: 'Bassa' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Critica' },
]

function initials(u) {
  if (!u) return '?'
  const a = u.firstName?.[0] || ''
  const b = u.lastName?.[0] || ''
  return `${a}${b}`.toUpperCase() || '?'
}

export default function TicketsList() {
  const { user } = useAuth()
  const nr = normalizeRole(user?.role)
  const [searchParams] = useSearchParams()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    categoryId: '',
    assignedTo: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 15,
  })
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const s = searchParams.get('search')
    if (s) {
      setFilters((p) => ({ ...p, search: s, page: 1 }))
    }
  }, [searchParams])

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v)
      })
      const res = await api.get(`/tickets?${params.toString()}`)
      setTickets(res.data.tickets)
      setPagination(res.data.pagination)
    } catch (e) {
      toast.error('Errore nel caricamento dei ticket')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleSort = (col) => {
    setFilters((p) => ({
      ...p,
      sortBy: col,
      sortOrder: p.sortBy === col && p.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      categoryId: '',
      assignedTo: '',
      dateFrom: '',
      dateTo: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 15,
    })
  }

  const statusPills = STATUS_OPTIONS.filter((o) => o.value)

  const columns = [
    {
      key: 'ticketNumber',
      label: 'Ticket',
      sortable: true,
      className: 'min-w-[220px]',
      render: (row) => (
        <div>
          <div className="font-mono text-xs text-text-secondary">#{row.ticketNumber}</div>
          <div className="font-semibold text-text-primary">{row.title}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Stato',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'category',
      label: 'Categoria',
      render: (row) => (
        <span className="inline-flex rounded-ds-sm border border-border-subtle bg-surface-hover px-2 py-0.5 text-xs text-text-secondary">
          {row.category?.name || '—'}
        </span>
      ),
    },
    {
      key: 'assignee',
      label: 'Assegnato',
      render: (row) =>
        row.assignee ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[11px] font-semibold text-text-primary ring-1 ring-border-subtle">
              {initials(row.assignee)}
            </div>
            <span className="text-sm text-text-primary">
              {row.assignee.firstName} {row.assignee.lastName}
            </span>
          </div>
        ) : (
          <span className="text-text-secondary">—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Creato',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-text-secondary" title={row.createdAt}>
          {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true, locale: it })}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priorità',
      sortable: true,
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link to={`/tickets/${row.id}`} className="text-[13px] font-medium text-accent hover:text-accent-hover">
          Apri
        </Link>
      ),
    },
  ]

  const showNewTicket = nr !== 'viewer'

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-text-primary">Lista Ticket</h1>
          <p className={ui.subtleText}>Cerca, filtra e gestisci i ticket</p>
        </div>
        {showNewTicket && (
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 rounded-ds bg-accent px-4 py-2 text-sm font-medium text-white shadow-card transition-colors duration-150 hover:bg-accent-hover hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-main"
          >
            <Plus size={18} /> Nuovo Ticket
          </Link>
        )}
      </div>

      {/* Quick status pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Stato</span>
        {statusPills.map((o) => {
          const active = filters.status === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() =>
                setFilters((p) => ({
                  ...p,
                  status: active ? '' : o.value,
                  page: 1,
                }))
              }
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                active
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border-subtle text-text-secondary hover:border-border-muted hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
            placeholder="Cerca per titolo, numero, descrizione..."
            className={`${ui.input} pl-10 pr-4`}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((p) => !p)}
          className={cn(
            'inline-flex items-center gap-2 rounded-ds border px-4 py-2.5 text-sm font-medium transition-colors duration-150',
            showFilters ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border-subtle bg-surface-card text-text-secondary hover:bg-surface-hover'
          )}
        >
          <Filter size={16} /> Filtri
        </button>
      </div>

      {showFilters && (
        <div className={`${ui.cardSection} grid animate-fade-in gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
          <div>
            <label className={ui.label}>Stato</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
              className={ui.select}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ui.label}>Priorità</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value, page: 1 }))}
              className={ui.select}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ui.label}>Categoria</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((p) => ({ ...p, categoryId: e.target.value, page: 1 }))}
              className={ui.select}
            >
              <option value="">Tutte</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ui.label}>Assegnato a</label>
            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters((p) => ({ ...p, assignedTo: e.target.value, page: 1 }))}
              className={ui.select}
            >
              <option value="">Tutti</option>
              <option value="unassigned">Non assegnato</option>
            </select>
          </div>
          <div>
            <label className={ui.label}>Dal</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value, page: 1 }))}
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Al</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value, page: 1 }))}
              className={ui.input}
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary">
              <X size={14} /> Resetta filtri
            </button>
          </div>
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className={`${ui.cardSection} flex flex-col items-center justify-center gap-3 py-16 text-center`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-ds bg-surface-hover text-text-secondary ring-1 ring-border-subtle">
            <Inbox size={28} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-text-primary">Nessun ticket trovato</div>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              Modifica i filtri oppure crea un nuovo ticket per iniziare a tracciare le richieste.
            </p>
          </div>
          {showNewTicket && (
            <Link
              to="/tickets/new"
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              Nuovo ticket
            </Link>
          )}
        </div>
      )}

      {(loading || tickets.length > 0) && (
        <DataTable
          columns={columns}
          data={tickets}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSort={handleSort}
          pagination={pagination}
          onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
          loading={loading}
        />
      )}
    </div>
  )
}
