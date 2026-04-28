import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { toast } from 'sonner'
import { Tags, Save } from 'lucide-react'
import { ui } from '../lib/utils'

export default function AssetCategoriesAdmin() {
  const [available, setAvailable] = useState([])
  const [selected, setSelected] = useState([])
  const [custom, setCustom] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/settings/asset-categories')
      .then((res) => {
        setAvailable(res.data.available || [])
        setSelected(res.data.selected || [])
        setCustom(res.data.custom || [])
      })
      .catch(() => toast.error('Errore nel caricamento categorie asset'))
  }, [])

  const normalizeCategory = (value) => value.trim().toUpperCase().replace(/\s+/g, '_')

  const toggle = (category) => {
    setSelected((prev) => (
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    ))
  }

  const addCustomCategory = () => {
    const normalized = normalizeCategory(newCategory)
    if (!normalized) {
      toast.error('Inserisci un nome categoria')
      return
    }
    if (normalized.length > 100) {
      toast.error('Categoria troppo lunga')
      return
    }
    if (available.includes(normalized)) {
      toast.error('Categoria già presente')
      return
    }

    setCustom((prev) => [...prev, normalized])
    setAvailable((prev) => [...prev, normalized])
    setSelected((prev) => [...prev, normalized])
    setNewCategory('')
  }

  const removeCustomCategory = (category) => {
    setCustom((prev) => prev.filter((c) => c !== category))
    setAvailable((prev) => prev.filter((c) => c !== category))
    setSelected((prev) => prev.filter((c) => c !== category))
  }

  const save = async () => {
    if (selected.length === 0) {
      toast.error('Seleziona almeno una categoria')
      return
    }

    setLoading(true)
    try {
      await api.put('/settings/asset-categories', { selected, custom })
      toast.success('Categorie asset aggiornate')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Errore nel salvataggio categorie')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorie Asset</h1>
        <p className={ui.subtleText}>Gestisci le categorie mostrate in inventario e creazione asset</p>
      </div>

      <div className={`${ui.cardSection} space-y-4`}>
        <div className="flex items-center gap-2">
          <Tags size={18} className="text-primary-400" />
          <h3 className="font-semibold text-sm">Selezione categorie attive</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {available.map((category) => (
            <div key={category} className="flex items-center justify-between rounded border border-slate-700/50 px-2 py-1.5">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(category)}
                  onChange={() => toggle(category)}
                  className="rounded border-slate-600 bg-slate-900 text-primary-500"
                />
                <span>{category}</span>
              </label>
              {custom.includes(category) && (
                <button onClick={() => removeCustomCategory(category)} className="text-xs text-rose-400 hover:text-rose-300">
                  Rimuovi
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-700/60 space-y-2">
          <div className="text-sm font-medium text-slate-200">Aggiungi categoria personalizzata</div>
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Es. FIREWALL"
              className={`${ui.input} flex-1`}
            />
            <button onClick={addCustomCategory} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors">
              Aggiungi
            </button>
          </div>
          <p className="text-xs text-slate-500">Formato automatico: MAIUSCOLO con underscore.</p>
        </div>

        <div className="pt-2 border-t border-slate-700/60">
          <button
            onClick={save}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white transition-colors"
          >
            <Save size={16} />
            {loading ? 'Salvataggio...' : 'Salva categorie'}
          </button>
        </div>
      </div>
    </div>
  )
}
