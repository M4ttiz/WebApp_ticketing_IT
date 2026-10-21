import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Search, Trash2, Package2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import api from '../api/axios'
import { ui } from '../lib/utils'

const DEFAULT_FORM = { name: '', code: '', description: '', quantity: 0, minimumStock: 0, notes: '' }

export default function SpareParts() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [modal, setModal] = useState(null)

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
    </div>
  )
}
