import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Server, FileSpreadsheet, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getAssets, deleteAsset, getTopOpenTicketsByProduct } from '../api/assets'
import api from '../api/axios'
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

const DEFAULT_CATEGORIES = [
  'LAPTOP', 'DESKTOP', 'MONITOR', 'STAMPANTE', 'ACCESS_POINT',
  'SERVER', 'SWITCH', 'ROUTER', 'TELEFONO', 'TABLET', 'ALTRO',
]

const CATEGORY_DASHBOARD_COLORS = {
  AP: '#16a34a',
  ACCESS_POINT: '#16a34a',
  'PC CLIENTE': '#2563eb',
  DESKTOP: '#2563eb',
  LAPTOP: '#2563eb',
  STAMPANTE: '#d97706',
  MONITOR: '#0d9488',
  SWITCH: '#7c3aed',
  ROUTER: '#db2777',
  NAS: '#4338ca',
  SERVER: '#dc2626',
  TELEFONO: '#0891b2',
  ALTRO: '#6b7280',
}

const STATUS_DASHBOARD_COLORS = {
  DISPONIBILE: '#16a34a',
  IN_USO: '#2563eb',
  IN_MANUTENZIONE: '#d97706',
  DISMESSO: '#6b7280',
  GUASTO: '#dc2626',
}

const CATEGORY_ICONS = {
  AP: '📶',
  ACCESS_POINT: '📶',
  'PC CLIENTE': '🖥️',
  DESKTOP: '🖥️',
  LAPTOP: '💻',
  STAMPANTE: '🖨️',
  MONITOR: '🖥️',
  SWITCH: '🔀',
  ROUTER: '📡',
  NAS: '💾',
  SERVER: '🗄️',
  TELEFONO: '📞',
  ALTRO: '📦',
}

const STATUS_ICONS = {
  DISPONIBILE: '✅',
  IN_USO: '🔵',
  IN_MANUTENZIONE: '🛠️',
  DISMESSO: '📦',
  GUASTO: '❌',
}

const DEFAULT_SEDE_COLOR = '#475569'

function normalizeCategoryName(value) {
  return (value || 'ALTRO').trim().toUpperCase()
}

function normalizeStatusName(value) {
  return (value || 'DISPONIBILE').trim().toUpperCase()
}

function statusLabel(value) {
  const normalized = normalizeStatusName(value)
  if (normalized === 'IN_USO') return 'In uso'
  if (normalized === 'IN_MANUTENZIONE') return 'In manutenzione'
  if (normalized === 'DISMESSO') return 'Dismesso'
  if (normalized === 'GUASTO') return 'Guasto'
  return 'Disponibile'
}

function categoryLabel(value) {
  const normalized = normalizeCategoryName(value)
  if (normalized === 'ACCESS_POINT') return 'AP'
  if (normalized === 'PC CLIENTE') return 'PC Cliente'
  if (normalized === 'ALTRO') return 'Altro'
  return normalized
}

function toCardStyle(hexColor, selected) {
  return {
    backgroundColor: hexColor,
    borderColor: selected ? '#f8fafc' : 'rgba(255,255,255,0.25)',
    borderWidth: selected ? '3px' : '1px',
    boxShadow: selected ? '0 10px 30px rgba(0,0,0,0.35)' : '0 6px 20px rgba(0,0,0,0.20)',
    filter: selected ? 'brightness(0.90)' : 'none',
  }
}

function normalizeLooseValue(value, fallback = '') {
  const normalized = String(value || '').trim()
  return normalized || fallback
}

function getUniqueSortedValues(items) {
  return Array.from(new Set(items.map((item) => normalizeLooseValue(item)).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'it'))
}

export default function Inventory() {
  const { user } = useAuth()
  const [rawAssets, setRawAssets] = useState([])
  const [kpiItems, setKpiItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [kpiLoading, setKpiLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState(['Tutte', ...DEFAULT_CATEGORIES])
  const [categoryFilter, setCategoryFilter] = useState('Tutte')
  const [locationFilter, setLocationFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [kpiLimit, setKpiLimit] = useState(10)
  const [kpiStatusFilter, setKpiStatusFilter] = useState('OPEN')
  const [kpiMonth, setKpiMonth] = useState('')
  const [kpiYear, setKpiYear] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsData, setStatsData] = useState({
    byCategory: [],
    bySede: [],
    byStatus: [],
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  useEffect(() => {
    api.get('/settings/asset-categories')
      .then((res) => {
        const selected = res.data.selected || DEFAULT_CATEGORIES
        setCategories(['Tutte', ...selected])
      })
      .catch(() => setCategories(['Tutte', ...DEFAULT_CATEGORIES]))
  }, [])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const params = {
        page: 1,
        limit: 1000,
        ...(categoryFilter !== 'Tutte' && { category: categoryFilter }),
      }
      const res = await getAssets(params)
      const items = res.data.items || []
      setRawAssets(items)
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
        limit: kpiLimit,
        status: kpiStatusFilter,
        ...(kpiMonth && { month: kpiMonth }),
        ...(kpiYear && { year: kpiYear }),
        ...(debouncedSearch && { search: debouncedSearch }),
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

  const fetchAssetStats = async () => {
    setStatsLoading(true)
    try {
      const res = await api.get('/assets/stats')
      setStatsData({
        byCategory: res.data?.byCategory || [],
        bySede: res.data?.bySede || [],
        byStatus: res.data?.byStatus || [],
      })
    } catch (err) {
      setStatsData({ byCategory: [], bySede: [], byStatus: [] })
      toast.error('Errore nel caricamento statistiche inventario')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [debouncedSearch, categoryFilter])

  useEffect(() => {
    fetchTopKpi()
  }, [debouncedSearch, categoryFilter, locationFilter, departmentFilter, kpiLimit, kpiStatusFilter, kpiMonth, kpiYear])

  useEffect(() => {
    fetchAssetStats()
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }
      fetchAssets()
      fetchTopKpi()
      fetchAssetStats()
    }, 60000)
    return () => clearInterval(intervalId)
  }, [debouncedSearch, categoryFilter, locationFilter, departmentFilter, kpiLimit, kpiStatusFilter, kpiMonth, kpiYear])

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

  const filteredAssets = useMemo(() => {
    const locationNeedle = locationFilter.trim().toLowerCase()
    const departmentNeedle = departmentFilter.trim().toLowerCase()
    const statusNeedle = statusFilter.trim().toUpperCase()
    const searchNeedle = search.trim().toLowerCase()

    if (!locationNeedle && !departmentNeedle && !statusNeedle && !searchNeedle) return rawAssets

    return rawAssets.filter((item) => {
      const nameValue = String(item.name || '').toLowerCase()
      const modelValue = String(item.model || '').toLowerCase()
      const searchMatches = !searchNeedle || nameValue.includes(searchNeedle) || modelValue.includes(searchNeedle)
      const locationMatches = !locationNeedle || (item.location || '').toLowerCase().includes(locationNeedle)
      const departmentMatches = !departmentNeedle || (item.assignedTo || '').toLowerCase().includes(departmentNeedle)
      const statusMatches = !statusNeedle || normalizeStatusName(item.status) === statusNeedle
      return searchMatches && locationMatches && departmentMatches && statusMatches
    })
  }, [rawAssets, locationFilter, departmentFilter, statusFilter, search])

  const categoryCards = useMemo(() => {
    return (statsData.byCategory || []).map((item) => {
      const normalizedCategory = normalizeCategoryName(item.category)
      return {
        key: normalizedCategory,
        filterValue: item.category || 'ALTRO',
        label: categoryLabel(item.category),
        count: item.count || 0,
        color: CATEGORY_DASHBOARD_COLORS[normalizedCategory] || CATEGORY_DASHBOARD_COLORS.ALTRO,
        icon: CATEGORY_ICONS[normalizedCategory] || CATEGORY_ICONS.ALTRO,
      }
    })
  }, [statsData])

  const sedeCards = useMemo(() => {
    return (statsData.bySede || []).map((item) => ({
      key: item.sede || 'Sede non definita',
      label: item.sede || 'Sede non definita',
      count: item.count || 0,
      color: DEFAULT_SEDE_COLOR,
      icon: '🏢',
    }))
  }, [statsData])

  const statusCards = useMemo(() => {
    return (statsData.byStatus || []).map((item) => {
      const normalizedStatus = normalizeStatusName(item.status)
      return {
        key: normalizedStatus,
        label: statusLabel(item.status),
        count: item.count || 0,
        color: STATUS_DASHBOARD_COLORS[normalizedStatus] || '#6b7280',
        icon: STATUS_ICONS[normalizedStatus] || 'ℹ️',
      }
    })
  }, [statsData])

  const sedeOptions = useMemo(() => getUniqueSortedValues((statsData.bySede || []).map((item) => item.sede || '')), [statsData])
  const repartoOptions = useMemo(() => getUniqueSortedValues((rawAssets || []).map((item) => item.assignedTo || '')), [rawAssets])
  const categoryOptions = useMemo(() => {
    const normalized = getUniqueSortedValues((statsData.byCategory || []).map((item) => item.category || 'ALTRO'))
    return ['Tutte', ...normalized]
  }, [statsData])
  const statusOptions = useMemo(() => {
    return getUniqueSortedValues((statsData.byStatus || []).map((item) => normalizeStatusName(item.status)))
  }, [statsData])

  const handleCategoryCardClick = (card) => {
    const isSelected = categoryFilter !== 'Tutte' && normalizeCategoryName(categoryFilter) === card.key
    setCategoryFilter(isSelected ? 'Tutte' : card.filterValue)
  }

  const handleSedeCardClick = (card) => {
    const isSelected = locationFilter.trim().toLowerCase() === card.label.trim().toLowerCase()
    setLocationFilter(isSelected ? '' : card.label)
  }

  const handleStatusCardClick = (card) => {
    const isSelected = normalizeStatusName(statusFilter) === card.key
    setStatusFilter(isSelected ? '' : card.key)
  }

  const handleResetQuickFilters = () => {
    setSearch('')
    setCategoryFilter('Tutte')
    setLocationFilter('')
    setDepartmentFilter('')
    setStatusFilter('')
  }

  const groupedAssets = useMemo(() => {
    const groups = {}
    filteredAssets.forEach((asset) => {
      const key = asset.category || 'ALTRO'
      if (!groups[key]) groups[key] = []
      groups[key].push(asset)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b, 'it'))
      .map(([category, list]) => [category, list.sort((a, b) => (a.assetTag || '').localeCompare(b.assetTag || '', 'it'))])
  }, [filteredAssets])

  const kpiChartData = useMemo(() => {
    return (kpiItems || []).map((item, idx) => ({
      id: item.id ?? String(idx),
      prodotto: item.descrizione || '-',
      openTickets: item.openTickets || 0,
      sede: item.sede || '',
      reparto: item.reparto || '',
      modello: item.modello || '',
      categoria: item.categoria || '',
    }))
  }, [kpiItems])

  const kpiColors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#10b981', '#a855f7']

  const exportData = filteredAssets.map((item) => ({
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
          {categories.map(c => <option key={c} value={c}>{c === 'Tutte' ? 'Tutte le categorie' : c}</option>)}
        </select>
        <input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Filtro sede..." className={ui.input} />
        <input value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} placeholder="Filtro reparto..." className={ui.input} />
      </div>

      <div className={`${ui.cardSection} p-4 space-y-4`}>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Dashboard inventario per categoria</h2>
          <p className="text-xs text-slate-400">Clicca una card per filtrare la tabella sottostante</p>
        </div>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(110px,1fr))]">
          {statsLoading ? (
            <div className="col-span-full text-sm text-slate-400">Caricamento card categoria...</div>
          ) : (
            categoryCards.map((card, index) => {
              const isSelected = categoryFilter !== 'Tutte' && normalizeCategoryName(categoryFilter) === card.key
              return (
                <motion.button
                  key={card.key}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative rounded-xl p-2 text-left text-white min-h-[80px] min-w-[110px] cursor-pointer transition-all"
                  style={toCardStyle(card.color, isSelected)}
                  onClick={() => handleCategoryCardClick(card)}
                >
                  <span className="absolute top-2 right-3 text-xl opacity-90">{card.icon}</span>
                  <div className="absolute bottom-2 left-2">
                    <p className="text-[22px] leading-none font-bold">{card.count}</p>
                    <p className="text-[10px] opacity-85">{card.label}</p>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Per sede</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {statsLoading ? (
            <div className="col-span-full text-sm text-slate-400">Caricamento card sedi...</div>
          ) : (
            sedeCards.map((card, index) => {
              const isSelected = locationFilter.trim().toLowerCase() === card.label.trim().toLowerCase()
              return (
                <motion.button
                  key={card.key}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative rounded-xl p-3 text-left text-white min-h-[100px] min-w-[140px] cursor-pointer transition-all"
                  style={toCardStyle(card.color, isSelected)}
                  onClick={() => handleSedeCardClick(card)}
                >
                  <span className="absolute top-2 right-3 text-xl opacity-90">{card.icon}</span>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-[28px] leading-none font-bold">{card.count}</p>
                    <p className="text-xs opacity-85">{card.label}</p>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Per stato</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {statsLoading ? (
            <div className="col-span-full text-sm text-slate-400">Caricamento card stati...</div>
          ) : (
            statusCards.map((card, index) => {
              const isSelected = normalizeStatusName(statusFilter) === card.key
              return (
                <motion.button
                  key={card.key}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative rounded-xl p-3 text-left text-white min-h-[100px] min-w-[140px] cursor-pointer transition-all"
                  style={toCardStyle(card.color, isSelected)}
                  onClick={() => handleStatusCardClick(card)}
                >
                  <span className="absolute top-2 right-3 text-xl opacity-90">{card.icon}</span>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-[28px] leading-none font-bold">{card.count}</p>
                    <p className="text-xs opacity-85">{card.label}</p>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>
      </div>

      <div className={`${ui.cardSection} p-4`}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ricerca descrizione o modello..."
              className={`${ui.input} pl-9`}
            />
          </div>
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className={ui.select}>
            <option value="">Tutte le sedi</option>
            {sedeOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className={ui.select}>
            <option value="">Tutti i reparti</option>
            {repartoOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={ui.select}>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>{item === 'Tutte' ? 'Tutte le categorie' : item}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={ui.select}>
            <option value="">Tutti gli stati</option>
            {statusOptions.map((item) => (
              <option key={item} value={item}>{statusLabel(item)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleResetQuickFilters}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors text-white"
          >
            Azzera filtri
          </button>
        </div>
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
                        <tr
                          key={asset.id}
                          className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${((isAdmin || user?.role === 'technician') && asset) ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (isAdmin || user?.role === 'technician') openEdit(asset)
                          }}
                        >
                          <td className="bg-blue-600/80" />
                          <td className="px-3 py-2 font-medium">{asset.name || '-'}</td>
                          <td className="px-3 py-2 text-slate-300">{asset.model || '-'}</td>
                          <td className="px-3 py-2 text-slate-300">{asset.category || '-'}</td>
                          <td className="px-3 py-2 text-slate-300">{asset.location || '-'}</td>
                          <td className="px-3 py-2 text-slate-300">{asset.assignedTo || '-'}</td>
                          <td className="px-3 py-2 text-slate-400 max-w-sm">
                            <div className="flex items-start justify-between gap-3">
                              <span className="truncate">{asset.notes || '-'}</span>
                              <div
                                className="flex flex-shrink-0 gap-2"
                                onClick={(e) => {
                                  // evita di aprire la modale quando clicchi sui pulsanti
                                  e.stopPropagation()
                                }}
                              >
                                {(isAdmin || user?.role === 'technician') && (
                                  <button
                                    onClick={() => openEdit(asset)}
                                    className="text-xs px-2 py-1 rounded-lg border border-slate-700/60 hover:bg-slate-700/40 text-slate-200"
                                  >
                                    Modifica
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => setConfirmDelete(asset)}
                                    className="text-xs px-2 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-200"
                                  >
                                    Elimina
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
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
          <div className="flex flex-col gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold">KPI ticket per prodotto (Top {kpiLimit})</h3>
              <p className="text-xs text-slate-400 mt-1">Filtrato in base ai criteri attivi su ricerca/categoria/sede/reparto</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Top N</label>
                <select
                  value={kpiLimit}
                  onChange={(e) => setKpiLimit(parseInt(e.target.value))}
                  className={ui.select}
                >
                  {[5, 10, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Stato ticket</label>
                <select
                  value={kpiStatusFilter}
                  onChange={(e) => setKpiStatusFilter(e.target.value)}
                  className={ui.select}
                >
                  <option value="OPEN">Aperti</option>
                  <option value="CLOSED">Chiusi</option>
                  <option value="ALL">Tutti</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mese</label>
                <select
                  value={kpiMonth}
                  onChange={(e) => setKpiMonth(e.target.value)}
                  className={ui.select}
                >
                  <option value="">Tutti</option>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const v = String(i + 1)
                    return <option key={v} value={v}>{v}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Anno</label>
                <select
                  value={kpiYear}
                  onChange={(e) => setKpiYear(e.target.value)}
                  className={ui.select}
                >
                  <option value="">Tutti</option>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const v = String(new Date().getFullYear() - i)
                    return <option key={v} value={v}>{v}</option>
                  })}
                </select>
              </div>
            </div>
          </div>

          {kpiLoading ? (
            <div className="text-sm text-slate-400">Caricamento KPI...</div>
          ) : kpiItems.length === 0 ? (
            <div className="text-sm text-slate-500">Nessun prodotto con ticket aperti</div>
          ) : (
            <div className="space-y-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpiChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="prodotto"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 14)}…` : v)}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={(val) => [`${val} ticket`, '']}
                    />
                    <Bar dataKey="openTickets" radius={[6, 6, 0, 0]}>
                      {kpiChartData.map((_, i) => (
                        <Cell key={i} fill={kpiColors[i % kpiColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {kpiItems.map((item, index) => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-700/60 bg-slate-900/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">#{index + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {item.openTickets} ticket
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium">{item.descrizione}</div>
                    <div className="text-xs text-slate-400">{item.modello} · {item.categoria}</div>
                    <div className="text-xs text-slate-500">{item.sede} · {item.reparto}</div>
                  </div>
                ))}
              </div>
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
    </div>
  )
}