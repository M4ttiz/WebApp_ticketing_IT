import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Server, FileSpreadsheet, FileDown, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getAssets, deleteAsset, getTopOpenTicketsByProduct, resetInventory } from '../api/assets'
import AssetModal from '../components/AssetModal'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { ui } from '../lib/utils'

const CATEGORY_COLORS = {
  LAPTOP: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/40',
  DESKTOP: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40',
  MONITOR: 'from-violet-500/20 to-violet-600/20 border-violet-500/40',
  STAMPANTE: 'from-amber-500/20 to-amber-600/20 border-amber-500/40',
  ACCESS_POINT: 'from-teal-500/20 to-teal-600/20 border-teal-500/40',
  SERVER: 'from-rose-500/20 to-rose-600/20 border-rose-500/40',
  SWITCH: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/40',
  ROUTER: 'from-fuchsia-500/20 to-fuchsia-600/20 border-fuchsia-500/40',
  TELEFONO: 'from-sky-500/20 to-sky-600/20 border-sky-500/40',
  TABLET: 'from-lime-500/20 to-lime-600/20 border-lime-500/40',
  ALTRO: 'from-slate-500/20 to-slate-600/20 border-slate-500/40',
}

const CATEGORIES = [
  'Tutte', 'LAPTOP', 'DESKTOP', 'MONITOR', 'STAMPANTE', 'ACCESS_POINT',
  'SERVER', 'SWITCH', 'ROUTER', 'TELEFONO', 'TABLET', 'ALTRO'
]

export default function Inventory() {
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [kpiItems, setKpiItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [kpiLoading, setKpiLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Tutte')
  const [locationFilter, setLocationFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const isAdmin = user?.role === 'admin'

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const params = {
        page: 1,
        limit: 100,
        ...(search && { search }),
        ...(categoryFilter !== 'Tutte' && { category: categoryFilter }),
      }
      const res = await getAssets(params)
      let items = res.data.items || []
      if (locationFilter.trim()) {
        items = items.filter((item) => (item.location || '').toLowerCase().includes(locationFilter.toLowerCase()))
      }
      if (departmentFilter.trim()) {
        items = items.filter((item) => (item.assignedTo || '').toLowerCase().includes(departmentFilter.toLowerCase()))
      }
      setAssets(items)
    } catch (err) {
      toast.error('Errore nel caricamento degli asset')
    } finally {
      setLoading(false)
    }
  }

  const fetchTopKpi = async () => {
    setKpiLoading(true)
    try {
      const params = {
        limit: 10,
        ...(search && { search }),
        ...(categoryFilter !== 'Tutte' && { category: categoryFilter }),
        ...(locationFilter && { location: locationFilter }),
        ...(departmentFilter && { department: departmentFilter }),
      }
      const res = await getTopOpenTicketsByProduct(params)
      setKpiItems(res.data.items || [])
    } catch (err) {
      toast.error('Errore nel caricamento KPI inventario')
    } finally {
      setKpiLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
    fetchTopKpi()
  }, [search, categoryFilter, locationFilter, departmentFilter])

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAssets()
      fetchTopKpi()
    }, 30000)
    return () => clearInterval(intervalId)
  }, [search, categoryFilter, locationFilter, departmentFilter])

  const handleDelete = async (id) => {
    try {
      await deleteAsset(id)
      toast.success('Asset eliminato')
      fetchAssets()
      fetchTopKpi()
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

  const handleReset = async () => {
    try {
      await resetInventory()
      toast.success('Inventario azzerato completamente')
      setAssets([])
      setKpiItems([])
      setSearch('')
      setCategoryFilter('Tutte')
      setLocationFilter('')
      setDepartmentFilter('')
      setConfirmReset(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset inventario fallito')
    }
  }

  const groupedAssets = useMemo(() => {
    const groups = {}
    assets.forEach((asset) => {
      const key = asset.category || 'ALTRO'
      if (!groups[key]) groups[key] = []
      groups[key].push(asset)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b, 'it'))
      .map(([category, list]) => [category, list.sort((a, b) => (a.assetTag || '').localeCompare(b.assetTag || '', 'it'))])
  }, [assets])

  const exportData = assets.map((item) => ({
    DESCRIZIONE: item.name || '',
    MODELLO: item.model || '',
    CATEGORIA: item.category || '',
    SEDE: item.location || '',
    REPARTO: item.assignedTo || '',
    NOTE: item.notes || '',
  }))

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleExportCsv = () => {
    const headers = ['DESCRIZIONE', 'MODELLO', 'CATEGORIA', 'SEDE', 'REPARTO', 'NOTE']
    const rows = exportData.map((r) => headers.map((h) => `"${String(r[h]).replaceAll('"', '""')}"`).join(';'))
    const csv = [headers.join(';'), ...rows].join('\n')
    downloadFile(csv, 'inventario.csv', 'text/csv;charset=utf-8;')
  }

  const handleExportExcel = () => {
    const headers = ['DESCRIZIONE', 'MODELLO', 'CATEGORIA', 'SEDE', 'REPARTO', 'NOTE']
    const rows = exportData.map((r) => headers.map((h) => String(r[h]).replaceAll('\t', ' ')).join('\t'))
    const tsv = [headers.join('\t'), ...rows].join('\n')
    downloadFile(tsv, 'inventario.xls', 'application/vnd.ms-excel;charset=utf-8;')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Server size={24} className="text-primary-400" />
            Inventario IT
          </h1>
          <p className={ui.subtleText}>Nuova struttura inventario con sezioni, filtri, export e KPI prodotto</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(isAdmin || user?.role === 'technician') && (
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors">
              <Plus size={16} /> Aggiungi riga
            </button>
          )}
          <button onClick={handleExportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors">
            <FileDown size={16} /> Export CSV
          </button>
          <button onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          {isAdmin && (
            <button onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors">
              <RotateCcw size={16} /> Reset completo
            </button>
          )}
        </div>
      </div>

      <div className={`${ui.cardSection} p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ricerca descrizione/modello/codice..."
            className={`${ui.input} pl-9`}
          />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={ui.select}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'Tutte' ? 'Tutte le categorie' : c}</option>)}
        </select>
        <input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Filtro sede..." className={ui.input} />
        <input value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} placeholder="Filtro reparto..." className={ui.input} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {loading ? (
            <div className={`${ui.cardSection} p-8 text-center text-slate-400`}>Caricamento inventario...</div>
          ) : groupedAssets.length === 0 ? (
            <div className={`${ui.cardSection} p-8 text-center text-slate-400`}>Nessun elemento in inventario</div>
          ) : (
            groupedAssets.map(([category, list]) => (
              <section key={category} className={`${ui.cardSection} overflow-hidden`}>
                <div className={`border-b border-slate-700 px-4 py-3 bg-gradient-to-r ${CATEGORY_COLORS[category] || CATEGORY_COLORS.ALTRO}`}>
                  <h3 className="text-sm font-semibold tracking-wide uppercase">{category}</h3>
                  <p className="text-xs text-slate-300">Sezione distinta per categoria · {list.length} elementi</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-700/60">
                        <th className="w-2 bg-blue-600/90" />
                        <th className="px-3 py-2 font-medium">DESCRIZIONE</th>
                        <th className="px-3 py-2 font-medium">MODELLO</th>
                        <th className="px-3 py-2 font-medium">CATEGORIA</th>
                        <th className="px-3 py-2 font-medium">SEDE</th>
                        <th className="px-3 py-2 font-medium">REPARTO</th>
                        <th className="px-3 py-2 font-medium">NOTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((asset) => (
                        <tr key={asset.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                          <td className="bg-blue-600/80" />
                          <td className="px-3 py-2 font-medium">{asset.name || '-'}</td>
                          <td className="px-3 py-2 text-slate-300">{asset.model || '-'}</td>
                          <td className="px-3 py-2 text-slate-300">{asset.category || '-'}</td>
                          <td className="px-3 py-2 text-slate-300">{asset.location || '-'}</td>
                          <td className="px-3 py-2 text-slate-300">{asset.assignedTo || '-'}</td>
                          <td className="px-3 py-2 text-slate-400 max-w-sm truncate">{asset.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </div>

        <div className={`${ui.cardSection} h-fit`}>
          <h3 className="text-sm font-semibold mb-3">KPI ticket aperti per prodotto (Top 10)</h3>
          <p className="text-xs text-slate-400 mb-4">Filtrato in base ai criteri attivi su ricerca/categoria/sede/reparto</p>
          {kpiLoading ? (
            <div className="text-sm text-slate-400">Caricamento KPI...</div>
          ) : kpiItems.length === 0 ? (
            <div className="text-sm text-slate-500">Nessun prodotto con ticket aperti</div>
          ) : (
            <div className="space-y-2">
              {kpiItems.map((item, index) => (
                <div key={item.id} className="p-3 rounded-lg border border-slate-700/60 bg-slate-900/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">#{index + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {item.openTickets} aperti
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium">{item.descrizione}</div>
                  <div className="text-xs text-slate-400">{item.modello} · {item.categoria}</div>
                  <div className="text-xs text-slate-500">{item.sede} · {item.reparto}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AssetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} asset={editingAsset} onSaved={() => { fetchAssets(); fetchTopKpi() }} />
      <ConfirmModal
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete?.id)}
        title="Elimina asset"
        message={`Sei sicuro di voler eliminare "${confirmDelete?.name}"? Questa azione è irreversibile.`}
        confirmText="Elimina"
        danger
      />
      <ConfirmModal
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="Reset completo inventario"
        message="Questa azione elimina tutti i dati inventario, configurazioni inventario/tracking e collegamenti ticket-asset. Continuare?"
        confirmText="Conferma reset"
        danger
      />
    </div>
  )
}