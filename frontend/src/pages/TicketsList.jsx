import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import { Search, Plus, Filter, X } from 'lucide-react'
import { toast } from 'sonner'
import { ui } from '../lib/utils'

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

export default function TicketsList() {
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

  const columns = [
    { key: 'ticketNumber', label: 'Numero', sortable: true, className: 'whitespace-nowrap font-mono text-xs text-slate-400' },
    { key: 'title', label: 'Titolo', sortable: true, className: 'max-w-xs truncate' },
    {
      key: 'status',
      label: 'Stato',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'priority',
      label: 'Priorità',
      sortable: true,
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    { key: 'category', label: 'Categoria', render: (row) => row.category?.name },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link to={`/tickets/${row.id}`} className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          Apri
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lista Ticket</h1>
          <p className={ui.subtleText}>Cerca, filtra e gestisci i ticket</p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} /> Nuovo Ticket
        </Link>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
            placeholder="Cerca per titolo, numero, descrizione..."
            className={`${ui.input} pl-10 pr-4`}
          />
        </div>
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            showFilters ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Filter size={16} /> Filtri
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className={`${ui.cardSection} grid gap-3 animate-fade-in sm:grid-cols-2 lg:grid-cols-4`}>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Stato</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
              className={ui.select}
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Priorità</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value, page: 1 }))}
              className={ui.select}
            >
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Categoria</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((p) => ({ ...p, categoryId: e.target.value, page: 1 }))}
              className={ui.select}
            >
              <option value="">Tutte</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Assegnato a</label>
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
            <label className="block text-xs text-slate-400 mb-1">Dal</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value, page: 1 }))}
              className={ui.input}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Al</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value, page: 1 }))}
              className={ui.input}
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} /> Resetta filtri
            </button>
          </div>
        </div>
      )}

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
    </div>
  )
}

