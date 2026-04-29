import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import AdminTabs from '../components/AdminTabs'
import Button from '../components/ui/Button'
import { TextField } from '../components/ui/SelectField'
import { toast } from 'sonner'
import { FolderPlus, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import { ui } from '../lib/utils'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)
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

  const performDelete = async () => {
    const target = pendingDelete
    if (!target?.id) return
    const id = target.id
    try {
      await api.delete(`/categories/${id}`)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('Categoria eliminata')
      setPendingDelete(null)
    } catch (e) {
      toast.error(e.response?.data?.error || "Errore durante l'eliminazione della categoria")
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
        <button type="button" onClick={() => toggleActive(c)} className="inline-flex items-center gap-1 text-sm">
          {c.isActive ? <ToggleRight size={20} className="text-semantic-success" /> : <ToggleLeft size={20} className="text-text-disabled" />}
          <span className={c.isActive ? 'text-semantic-success' : 'text-text-secondary'}>{c.isActive ? 'Attiva' : 'Disattivata'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(c)
              setForm({ name: c.name, description: c.description || '' })
            }}
            className="rounded-ds p-1.5 text-accent transition-colors hover:bg-accent/10"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPendingDelete(c)}
            className="rounded-ds p-1.5 text-semantic-danger transition-colors hover:bg-semantic-danger/10"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <AdminTabs className="mb-2" />

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-text-primary">Categorie</h1>
          <p className={ui.subtleText}>Gestisci le categorie dei ticket</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null)
            setForm({ name: '', description: '' })
          }}
        >
          <FolderPlus size={18} /> Nuova Categoria
        </Button>
      </div>

      <div className={`${ui.cardSection} space-y-4 border-border-subtle`}>
        <h3 className="text-sm font-semibold text-text-primary">{editing ? 'Modifica categoria' : 'Nuova categoria'}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <TextField
            placeholder="Descrizione (opzionale)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={save}>
            {editing ? 'Salva modifiche' : 'Crea'}
          </Button>
          {editing && (
            <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm({ name: '', description: '' }) }}>
              Annulla
            </Button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={categories} loading={loading} />

      <ConfirmModal
        open={!!pendingDelete}
        title="Elimina categoria"
        message="Sei sicuro? Questa azione non è reversibile."
        danger
        confirmText="Elimina"
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
