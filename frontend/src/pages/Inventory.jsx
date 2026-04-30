import React, { useEffect, useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Plus, Server } from 'lucide-react'
import { toast } from 'sonner'
import { getAssets, deleteAsset } from '../api/assets'
import AssetModal from '../components/AssetModal'
import ConfirmModal from '../components/ConfirmModal'
import AssetTableGrouped from '../components/inventory/AssetTableGrouped'
import InventoryDashboard from '../components/inventory/InventoryDashboard'
import InventoryFilters from '../components/inventory/InventoryFilters'
import LocationSidebar from '../components/inventory/LocationSidebar'
import { useAuth } from '../context/AuthContext'
import { ui } from '../lib/utils'

const PAGE_SIZE = 50

function normalizeText(value, fallback) {
  const text = String(value || '').trim()
  return text || fallback
}

function normalizeStatus(value) {
  return normalizeText(value, 'DISPONIBILE').toUpperCase()
}

function statusOptionLabel(status) {
  if (status === 'IN_MANUTENZIONE' || status === 'MAINTENANCE') return 'In manutenzione'
  if (status === 'IN_USO' || status === 'IN_USE') return 'In uso'
  if (status === 'DISMESSO' || status === 'DISPOSED') return 'Dismesso'
  if (status === 'GUASTO') return 'Guasto'
  return 'Disponibile'
}

function buildLocationTree(assets) {
  const map = new Map()

  assets.forEach((asset) => {
    const location = normalizeText(asset.location, 'Sede non definita')
    const department = normalizeText(asset.assignedTo, 'Reparto non definito')

    if (!map.has(location)) {
      map.set(location, { name: location, count: 0, departments: new Map() })
    }
    const locationNode = map.get(location)
    locationNode.count += 1

    if (!locationNode.departments.has(department)) {
      locationNode.departments.set(department, { name: department, count: 0, assets: [] })
    }
    const departmentNode = locationNode.departments.get(department)
    departmentNode.count += 1
    departmentNode.assets.push(asset)
  })

  return Array.from(map.values())
    .map((locationNode) => ({
      name: locationNode.name,
      count: locationNode.count,
      departments: Array.from(locationNode.departments.values())
        .map((departmentNode) => ({
          ...departmentNode,
          critical: departmentNode.count < 2,
          assets: departmentNode.assets.sort((a, b) => normalizeText(a.name, '').localeCompare(normalizeText(b.name, ''), 'it')),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'it')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'it'))
}

function flattenOptions(assets) {
  const locations = new Set()
  const departments = new Set()
  const categories = new Set()
  const statusesMap = new Map()

  assets.forEach((asset) => {
    locations.add(normalizeText(asset.location, 'Sede non definita'))
    departments.add(normalizeText(asset.assignedTo, 'Reparto non definito'))
    categories.add(normalizeText(asset.category, 'ALTRO'))
    const status = normalizeStatus(asset.status)
    statusesMap.set(status, statusOptionLabel(status))
  })

  return {
    locations: Array.from(locations).sort((a, b) => a.localeCompare(b, 'it')),
    departments: Array.from(departments).sort((a, b) => a.localeCompare(b, 'it')),
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b, 'it')),
    statuses: Array.from(statusesMap.entries()).map(([value, label]) => ({ value, label })),
  }
}

function groupForTable(assets) {
  return buildLocationTree(assets).map((location) => ({
    name: location.name,
    count: location.count,
    departments: location.departments.map((department) => ({
      name: department.name,
      assets: department.assets,
    })),
  }))
}

function getKpis(assets) {
  const inUse = assets.filter((item) => ['IN_USO', 'IN_USE'].includes(normalizeStatus(item.status))).length
  const maintenance = assets.filter((item) => ['IN_MANUTENZIONE', 'MAINTENANCE'].includes(normalizeStatus(item.status))).length
  const available = assets.filter((item) => ['DISPONIBILE', 'AVAILABLE'].includes(normalizeStatus(item.status))).length
  const warehouse = assets.filter((item) => !normalizeText(item.assignedTo, '')).length
  return {
    total: { label: 'Totale asset', value: assets.length },
    inUse: { label: 'In uso', value: inUse },
    warehouse: { label: 'In magazzino', value: warehouse },
    available: { label: 'Disponibili', value: available - maintenance < 0 ? 0 : available - maintenance },
  }
}

export default function Inventory() {
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    department: '',
    category: '',
    status: '',
    criticalOnly: false,
  })
  const [page, setPage] = useState(1)
  const [expandedLocations, setExpandedLocations] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const isAdmin = user?.role === 'admin'
  const canEdit = isAdmin || user?.role === 'technician'

  const loadAssets = async () => {
    setLoading(true)
    try {
      const res = await getAssets({ page: 1, limit: 1000 })
      setAssets(res.data.items || [])
    } catch (err) {
      toast.error('Errore nel caricamento inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssets()
  }, [])

  const options = useMemo(() => flattenOptions(assets), [assets])
  const departmentCounts = useMemo(() => {
    const counts = new Map()
    assets.forEach((asset) => {
      const key = `${normalizeText(asset.location, 'Sede non definita')}::${normalizeText(asset.assignedTo, 'Reparto non definito')}`
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    return counts
  }, [assets])

  const filteredAssets = useMemo(() => {
    const searchNeedle = filters.search.trim().toLowerCase()
    return assets.filter((asset) => {
      const location = normalizeText(asset.location, 'Sede non definita')
      const department = normalizeText(asset.assignedTo, 'Reparto non definito')
      const category = normalizeText(asset.category, 'ALTRO')
      const status = normalizeStatus(asset.status)
      const departmentKey = `${location}::${department}`
      const criticalDepartment = (departmentCounts.get(departmentKey) || 0) < 2

      const matchSearch = !searchNeedle || normalizeText(asset.name, '').toLowerCase().includes(searchNeedle) || normalizeText(asset.model, '').toLowerCase().includes(searchNeedle)
      const matchLocation = !filters.location || filters.location === location
      const matchDepartment = !filters.department || filters.department === department
      const matchCategory = !filters.category || filters.category === category
      const matchStatus = !filters.status || filters.status === status
      const matchCritical = !filters.criticalOnly || criticalDepartment || ['IN_MANUTENZIONE', 'MAINTENANCE', 'GUASTO'].includes(status)

      return matchSearch && matchLocation && matchDepartment && matchCategory && matchStatus && matchCritical
    })
  }, [assets, departmentCounts, filters])

  const locationTree = useMemo(() => buildLocationTree(filteredAssets), [filteredAssets])
  const kpis = useMemo(() => getKpis(filteredAssets), [filteredAssets])

  const pagedAssets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredAssets.slice(start, start + PAGE_SIZE)
  }, [filteredAssets, page])

  const totalPages = Math.ceil(filteredAssets.length / PAGE_SIZE) || 1
  const tableGroups = useMemo(() => groupForTable(pagedAssets), [pagedAssets])

  useEffect(() => {
    setPage(1)
  }, [filters])

  const updateFilter = (key) => (event) => {
    const value = event.target.value
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleLocationSelect = (location) => {
    setFilters((prev) => ({
      ...prev,
      location: prev.location === location ? '' : location,
      department: prev.location === location ? '' : prev.department,
    }))
  }

  const handleDepartmentSelect = (location, department) => {
    setFilters((prev) => {
      const sameSelection = prev.location === location && prev.department === department
      return {
        ...prev,
        location: sameSelection ? '' : location,
        department: sameSelection ? '' : department,
      }
    })
  }

  const handleToggleLocation = (location) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev)
      if (next.has(location)) next.delete(location)
      else next.add(location)
      return next
    })
  }

  const handleToggleCritical = () => {
    setFilters((prev) => ({ ...prev, criticalOnly: !prev.criticalOnly }))
  }

  const handleReset = () => {
    setFilters({
      search: '',
      location: '',
      department: '',
      category: '',
      status: '',
      criticalOnly: false,
    })
  }

  const handleDelete = async (asset) => {
    try {
      await deleteAsset(asset.id)
      toast.success('Asset eliminato')
      await loadAssets()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore eliminazione asset')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openCreate = () => {
    setEditingAsset(null)
    setModalOpen(true)
  }

  const openEdit = (asset) => {
    setEditingAsset(asset)
    setModalOpen(true)
  }

  const exportData = filteredAssets.map((item) => ({
    NOME: item.name || '',
    CATEGORIA: item.category || '',
    MARCA_MODELLO: [item.brand, item.model].filter(Boolean).join(' ') || '',
    SEDE: item.location || '',
    REPARTO: item.assignedTo || '',
    STATO: item.status || '',
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
    const headers = ['NOME', 'CATEGORIA', 'MARCA_MODELLO', 'SEDE', 'REPARTO', 'STATO']
    const rows = exportData.map((row) => headers.map((header) => `"${String(row[header]).replaceAll('"', '""')}"`).join(';'))
    downloadFile([headers.join(';'), ...rows].join('\n'), 'inventario.csv', 'text/csv;charset=utf-8;')
  }

  const handleExportExcel = () => {
    const headers = ['NOME', 'CATEGORIA', 'MARCA_MODELLO', 'SEDE', 'REPARTO', 'STATO']
    const rows = exportData.map((row) => headers.map((header) => String(row[header]).replaceAll('\t', ' ')).join('\t'))
    downloadFile([headers.join('\t'), ...rows].join('\n'), 'inventario.xls', 'application/vnd.ms-excel;charset=utf-8;')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Server size={24} className="text-primary-400" />
            Inventario IT
          </h1>
          <p className={ui.subtleText}>Dashboard gerarchica sede e reparto con tabella raggruppata</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors">
              <Plus size={16} />
              Nuovo asset
            </button>
          )}
          <button type="button" onClick={handleExportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors">
            <FileDown size={16} />
            CSV
          </button>
          <button type="button" onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors">
            <FileSpreadsheet size={16} />
            Excel
          </button>
        </div>
      </div>

      <InventoryDashboard
        kpis={kpis}
        locationTree={locationTree}
        expandedLocations={expandedLocations}
        onToggleLocation={handleToggleLocation}
        onSelectNode={handleDepartmentSelect}
        criticalFilterEnabled={filters.criticalOnly}
        onToggleCriticalFilter={handleToggleCritical}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <LocationSidebar
          tree={locationTree}
          selectedLocation={filters.location}
          selectedDepartment={filters.department}
          onLocationSelect={handleLocationSelect}
          onDepartmentSelect={handleDepartmentSelect}
        />
        <div className="xl:col-span-3 space-y-3">
          <InventoryFilters
            filters={filters}
            options={options}
            onSearchChange={updateFilter('search')}
            onLocationChange={updateFilter('location')}
            onDepartmentChange={updateFilter('department')}
            onCategoryChange={updateFilter('category')}
            onStatusChange={updateFilter('status')}
            onReset={handleReset}
          />

          {loading ? (
            <div className={`${ui.cardSection} p-8 text-center text-slate-400`}>Caricamento inventario...</div>
          ) : filteredAssets.length === 0 ? (
            <div className={`${ui.cardSection} p-8 text-center text-slate-400`}>Nessun asset per i filtri selezionati</div>
          ) : (
            <AssetTableGrouped
              groups={tableGroups}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              canEdit={canEdit}
              canDelete={isAdmin}
              onEdit={openEdit}
              onDelete={setConfirmDelete}
            />
          )}
        </div>
      </div>

      <AssetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} asset={editingAsset} onSaved={loadAssets} />
      <ConfirmModal
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Elimina asset"
        message={`Sei sicuro di voler eliminare "${confirmDelete?.name}"? Questa azione è irreversibile.`}
        confirmText="Elimina"
        danger
      />
    </div>
  )
}
