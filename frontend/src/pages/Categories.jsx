import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import { toast } from 'sonner'
import { ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories?includeInactive=true')
      setCategories(res.data)
    } catch (e) {
      toast.error('Errore nel caricamento categorie')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const save = async () => {
    try {
      if (editing) {
        await api.patch(`/categories/${editing.id}`, form)
        toast.success('Categoria aggiornata')
      } else {
        await api.post('/categories', form)
        toast.success('Categoria creata')
      }
      setEditing(null)
      setForm({ name: '', description: '' })
      fetchCategories()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore')
    }
  }

  const toggleActive = async (cat) => {
    try {
      await api.patch(`/categories/${cat.id}`, { isActive: !cat.isActive })
      toast.success('Stato aggiornato')
      fetchCategories()
    } catch (e) {
      toast.error('Errore')
    }
  }

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Categoria eliminata')
      setModal(null)
      fetchCategories()
    } catch (e) {
      toast.error('Errore')
    }
  }

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'description', label: 'Descrizione', render: (c) => c.description || '—' },
    { key: 'tickets', label: 'Ticket', render: (c) => c._count?.tickets || 0 },
    {
      key: 'active',
      label: 'Stato',
      render: (c) => (
        <button onClick={() => toggleActive(c)} className="inline-flex items-center gap-1 text-sm">
          {c.isActive ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
          <span className={c.isActive ? 'text-green-400' : 'text-slate-500'}>{c.isActive ? 'Attiva' : 'Disattivata'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || '' }) }}
            className="p-1.5 rounded hover:bg-slate-700 text-primary-400 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setModal({ type: 'delete', category: c })}
            className="p-1.5 rounded hover:bg-rose-500/10 text-rose-400 transition-colors"
          >
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
          <h1 className="text-2xl font-bold">Categorie</h1>
          <p className="text-slate-400 text-sm">Gestisci le categorie dei ticket</p>
        </div>
      </div>

      {/* Create/Edit form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold">{editing ? 'Modifica categoria' : 'Nuova categoria'}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
          />
          <input
            placeholder="Descrizione (opzionale)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 rounded-lg text-sm bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors">
            {editing ? 'Salva modifiche' : 'Crea'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ name: '', description: '' }) }} className="px-4 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 transition-colors">
              Annulla
            </button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={categories} loading={loading} />

      <ConfirmModal
        open={modal?.type === 'delete'}
        title="Elimina categoria"
        message={`Sei sicuro di voler eliminare "${modal?.category?.name}"? Tutti i ticket collegati verranno eliminati.`}
        danger
        onConfirm={() => deleteCategory(modal.category.id)}
        onCancel={() => setModal(null)}
      />
    </div>
  )
}

