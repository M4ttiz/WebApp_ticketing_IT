import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Search, Trash2, Package2, Plus, ToggleLeft, ToggleRight, History } from 'lucide-react'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import api from '../api/axios'
import { ui } from '../lib/utils'

const DEFAULT_FORM = { name: '', code: '', description: '', quantity: 0, minimumStock: 0, notes: '' }

export default function SpareParts() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [modal, setModal] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await api.get('/spare-parts?includeInactive=true')
      setItems(res.data)
    } catch (e) {
      toast.error('Errore nel caricamento dei ricambi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => [item.name, item.code, item.description, item.notes].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [items, search])

  const save = async () => {
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        minimumStock: Number(form.minimumStock) || 0,
      }

      if (editing) {
        await api.patch(`/spare-parts/${editing.id}`, payload)
        toast.success('Ricambio aggiornato')
      } else {
        await api.post('/spare-parts', payload)
        toast.success('Ricambio creato')
      }

      setEditing(null)
      setForm(DEFAULT_FORM)
      fetchItems()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore nel salvataggio del ricambio')
    }
  }

  const toggleStatus = async (item) => {
    try {
      await api.patch(`/spare-parts/${item.id}`, { isActive: !item.isActive })
      toast.success('Stato aggiornato')
      fetchItems()
    } catch (e) {
      toast.error('Errore nel cambio di stato')
    }
  }

  const deleteItem = async (id) => {
    try {
      await api.delete(`/spare-parts/${id}`)
      toast.success('Ricambio disattivato o eliminato')
      setModal(null)
      fetchItems()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore nell’eliminazione')
    }
  }

  const openHistory = async (item) => {
    try {
      const res = await api.get(`/spare-parts/${item.id}/history`)
      setHistoryModal({ item, rows: res.data || [] })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore nel caricamento dello storico')
    }
  }

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'code', label: 'Codice', render: (row) => row.code || '—' },
    { key: 'quantity', label: 'Disponibilità', render: (row) => row.quantity ?? 0 },
    { key: 'minimumStock', label: 'Soglia minima', render: (row) => row.minimumStock ?? 0 },
    { key: 'description', label: 'Descrizione', render: (row) => row.description || '—' },
    {
      key: 'status',
      label: 'Stato',
      render: (row) => (
        <button onClick={() => toggleStatus(row)} className="inline-flex items-center gap-1 text-sm">
          {row.isActive ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} className="text-slate-500" />}
          <span className={row.isActive ? 'text-green-400' : 'text-slate-500'}>{row.isActive ? 'Attivo' : 'Disattivato'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openHistory(row)} className="p-1.5 rounded hover:bg-slate-700 text-amber-400 transition-colors" title="Storico utilizzi">
            <History size={16} />
          </button>
          <button onClick={() => { setEditing(row); setForm({ name: row.name, code: row.code || '', description: row.description || '', quantity: row.quantity ?? 0, minimumStock: row.minimumStock ?? 0, notes: row.notes || '' }) }} className="p-1.5 rounded hover:bg-slate-700 text-primary-400 transition-colors">
            <Pencil size={16} />
          </button>
          <button onClick={() => setModal({ type: 'delete', item: row })} className="p-1.5 rounded hover:bg-rose-500/10 text-rose-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pezzi di ricambio</h1>
          <p className="text-slate-400 text-sm">Catalogo autonoma e storico di utilizzo</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Package2 size={16} className="text-primary-400" />
            {editing ? 'Modifica ricambio' : 'Nuovo ricambio'}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={ui.input} placeholder="Nome ricambio" />
          <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className={ui.input} placeholder="Codice articolo (opzionale)" />
          <input type="number" min="0" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className={ui.input} placeholder="Disponibilità" />
          <input type="number" min="0" value={form.minimumStock} onChange={(e) => setForm((p) => ({ ...p, minimumStock: e.target.value }))} className={ui.input} placeholder="Scorta minima" />
          <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={ui.input} placeholder="Note (opzionali)" />
        </div>

        <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={ui.textarea} placeholder="Descrizione (opzionale)" rows={3} />

        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 rounded-lg text-sm bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors">
            {editing ? 'Salva modifiche' : 'Aggiungi ricambio'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(DEFAULT_FORM) }} className="px-4 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 transition-colors">
              Annulla
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className={`${ui.input} pl-9`} placeholder="Cerca ricambio" />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} />

      <ConfirmModal
        open={modal?.type === 'delete'}
        title="Disattiva ricambio"
        message={`Vuoi disattivare "${modal?.item?.name}"? Lo storico dei ticket verrà conservato.`}
        onConfirm={() => deleteItem(modal.item.id)}
        onCancel={() => setModal(null)}
        danger
      />

      <ConfirmModal
        open={!!historyModal}
        title={`Storico: ${historyModal?.item?.name || ''}`}
        message="Movimenti di magazzino e utilizzi relativi a questo ricambio:"
        onConfirm={() => setHistoryModal(null)}
        onCancel={() => setHistoryModal(null)}
        confirmText="Chiudi"
      >
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {historyModal?.rows?.length ? (
            historyModal.rows.map((row) => {
              const isPositive = row.movementType === 'POSITIVE'
              const dateLabel = row.createdAt ? new Date(row.createdAt).toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'Data non disponibile'

              if (!row.ticketId) {
                return (
                  <div key={row.id} className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-100">Acquisto / rifornimento</div>
                        <div className="text-[11px] text-slate-400">{dateLabel}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-300">+{row.quantity}</div>
                        <div className="text-[10px] uppercase tracking-wide text-emerald-400">in entrata</div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    setHistoryModal(null)
                    navigate(`/tickets/${row.ticketId}`)
                  }}
                  className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-left hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-100">#{row.ticketNumber}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[220px]">{row.title}</div>
                    <div className="text-[10px] text-slate-500">{dateLabel}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {isPositive ? '+' : '-'}{row.quantity}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-primary-400">{row.status}</div>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="text-sm text-slate-400">Nessun movimento registrato per questo ricambio.</div>
          )}
        </div>
      </ConfirmModal>
    </div>
  )
}
