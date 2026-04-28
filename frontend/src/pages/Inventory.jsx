import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Server, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { getAssets, deleteAsset } from '../api/assets'
import AssetModal from '../components/AssetModal'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { ui } from '../lib/utils'

const STATUS_COLORS = {
  DISPONIBILE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  IN_USO: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IN_MANUTENZIONE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DISMESSO: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  GUASTO: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

const CATEGORIES = [
  'Tutte', 'LAPTOP', 'DESKTOP', 'MONITOR', 'STAMPANTE',
  'SERVER', 'SWITCH', 'ROUTER', 'TELEFONO', 'TABLET', 'ALTRO'
]

const STATUSES = [
  'Tutti', 'DISPONIBILE', 'IN_USO', 'IN_MANUTENZIONE', 'DISMESSO', 'GUASTO'
]

export default function Inventory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Tutte')
  const [statusFilter, setStatusFilter] = useState('Tutti')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const isAdmin = user?.role === 'admin'

  const fetchAssets = async (p = page) => {
    setLoading(true)
    try {
      const params = {
        page: p,
        limit: 20,
        ...(search && { search }),
        ...(categoryFilter !== 'Tutte' && { category: categoryFilter }),
        ...(statusFilter !== 'Tutti' && { status: statusFilter }),
      }
      const res = await getAssets(params)
      setAssets(res.data.items || [])
      setTotalPages(res.data.pagination?.totalPages || 1)
      setPage(p)
    } catch (err) {
      toast.error('Errore nel caricamento degli asset')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets(1)
  }, [search, categoryFilter, statusFilter])

  useEffect(() => {
    fetchAssets(page)
  }, [page])

  const handleDelete = async (id) => {
    try {
      await deleteAsset(id)
      toast.success('Asset eliminato')
      fetchAssets(page)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore nell\'eliminazione')
    }
    setConfirmDelete(null)
  }

  const openEdit = (asset) => {
    setEditingAsset(asset)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditingAsset(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Server size={24} className="text-primary-400" />
            Inventario IT
          </h1>
          <p className={ui.subtleText}>Gestione asset hardware e dispositivi</p>
        </div>
        {(isAdmin || user?.role === 'technician') && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors">
            <Plus size={16} /> Aggiungi asset
          </button>
        )}
      </div>

      {/* Filtri */}
      <div className={`${ui.cardSection} p-4 flex flex-col sm:flex-row gap-3`}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cerca per nome, seriale o tag..."
            className={`${ui.input} pl-9`}
          />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }} className={ui.select}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'Tutte' ? 'Tutte le categorie' : c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className={ui.select}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'Tutti' ? 'Tutti gli stati' : s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Tabella */}
      <div className={`${ui.cardSection} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-slate-400">
              <th className="px-4 py-3 font-medium">Tag</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Marca/Modello</th>
              <th className="px-4 py-3 font-medium">S/N</th>
              <th className="px-4 py-3 font-medium">Stato</th>
              <th className="px-4 py-3 font-medium">Assegnato a</th>
              <th className="px-4 py-3 font-medium">Sede</th>
              <th className="px-4 py-3 font-medium">Garanzia</th>
              {isAdmin && <th className="px-4 py-3 font-medium text-right">Azioni</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 10 : 9} className="px-4 py-8 text-center text-slate-500">Caricamento...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={isAdmin ? 10 : 9} className="px-4 py-8 text-center text-slate-500">Nessun asset trovato</td></tr>
            ) : (
              assets.map(asset => (
                <motion.tr
                  key={asset.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/inventory/${asset.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{asset.assetTag || '-'}</td>
                  <td className="px-4 py-3 font-medium">{asset.name}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.category}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.brand && asset.model ? `${asset.brand} ${asset.model}` : asset.brand || asset.model || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{asset.serialNumber || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[asset.status]}`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{asset.assignedTo || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.location || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {asset.warrantyExpiry
                      ? new Date(asset.warrantyExpiry) < new Date()
                        ? <span className="text-rose-400">Scaduta</span>
                        : new Date(asset.warrantyExpiry).toLocaleDateString('it-IT')
                      : '-'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={e => { e.stopPropagation(); openEdit(asset) }} className="text-primary-400 hover:text-primary-300 text-xs mr-3">
                        Modifica
                      </button>
                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(asset) }} className="text-rose-400 hover:text-rose-300 text-xs">
                        Elimina
                      </button>
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginazione */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">Pagina {page} di {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
        )}
      </div>

      <AssetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} asset={editingAsset} onSaved={() => fetchAssets(page)} />
      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete?.id)} title="Elimina asset" message={`Sei sicuro di voler eliminare "${confirmDelete?.name}"? Questa azione è irreversibile.`} confirmText="Elimina" danger />
    </div>
  )
}
