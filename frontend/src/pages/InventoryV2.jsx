import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Server, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { getAssets } from '../api/assets'
import AssetModal from '../components/AssetModal'
import CategoryDetail from '../components/inventory/CategoryDetail'
import CategoryGrid from '../components/inventory/CategoryGrid'
import AssetTableSimple from '../components/inventory/AssetTableSimple'
import InventoryFilters from '../components/inventory/InventoryFilters'
import { useAuth } from '../context/AuthContext'
import { ui } from '../lib/utils'

const PAGE_SIZE = 50

function normalizeText(value, fallback) {
  const text = String(value || '').trim()
  return text || fallback
}

function categoryLabel(category) {
  const value = normalizeText(category, 'ALTRO').toUpperCase()
  if (value === 'ACCESS_POINT') return 'Access Point'
  if (value === 'LAPTOP') return 'Laptop'
  if (value === 'DESKTOP') return 'Desktop'
  if (value === 'STAMPANTE') return 'Stampante'
  if (value === 'MONITOR') return 'Monitor'
  if (value === 'SERVER') return 'Server'
  if (value === 'SWITCH') return 'Switch'
  if (value === 'ROUTER') return 'Router'
  if (value === 'NAS') return 'NAS'
  return value
}

function extractDepartment(asset) {
  return normalizeText(asset.department || asset.assignedTo, 'Non definito')
}

function buildCategorySummary(assets) {
  const byCategory = new Map()
  assets.forEach((asset) => {
    const category = normalizeText(asset.category, 'ALTRO').toUpperCase()
    if (!byCategory.has(category)) {
      byCategory.set(category, { category, label: categoryLabel(category), count: 0 })
    }
    byCategory.get(category).count += 1
  })
  return Array.from(byCategory.values()).sort((a, b) => b.count - a.count)
}

function buildCategoryDetail(assets, selectedCategory) {
  if (!selectedCategory) return null
  const filtered = assets.filter((asset) => normalizeText(asset.category, 'ALTRO').toUpperCase() === selectedCategory)
  const byLocation = new Map()

  filtered.forEach((asset) => {
    const location = normalizeText(asset.location, 'Sede non definita')
    const department = extractDepartment(asset)
    if (!byLocation.has(location)) byLocation.set(location, { name: location, count: 0, departments: new Map() })
    const locationNode = byLocation.get(location)
    locationNode.count += 1
    if (!locationNode.departments.has(department)) locationNode.departments.set(department, { name: department, count: 0 })
    locationNode.departments.get(department).count += 1
  })

  return {
    category: selectedCategory,
    label: categoryLabel(selectedCategory),
    total: filtered.length,
    locations: Array.from(byLocation.values())
      .map((location) => ({
        name: location.name,
        count: location.count,
        departments: Array.from(location.departments.values()).sort((a, b) => a.name.localeCompare(b.name, 'it')),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'it')),
  }
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export default function InventoryV2() {
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showTableForCategory, setShowTableForCategory] = useState(false)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)

  const canEdit = user?.role === 'admin' || user?.role === 'technician'

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

  const filterActive = Boolean(location || department || search.trim())

  const filteredAssets = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return assets.filter((asset) => {
      const assetLocation = normalizeText(asset.location, 'Sede non definita')
      const assetDepartment = extractDepartment(asset)
      const searchMatch = !needle || [
        asset.name,
        asset.brand,
        asset.model,
        asset.assetTag,
        asset.serialNumber,
      ].some((value) => String(value || '').toLowerCase().includes(needle))
      const locationMatch = !location || location === assetLocation
      const departmentMatch = !department || department === assetDepartment
      return searchMatch && locationMatch && departmentMatch
    })
  }, [assets, search, location, department])

  const categories = useMemo(() => buildCategorySummary(filteredAssets), [filteredAssets])
  const detail = useMemo(() => buildCategoryDetail(filteredAssets, selectedCategory), [filteredAssets, selectedCategory])

  const tableSource = useMemo(() => {
    const withCategory = selectedCategory && showTableForCategory
      ? filteredAssets.filter((asset) => normalizeText(asset.category, 'ALTRO').toUpperCase() === selectedCategory)
      : filteredAssets
    return withCategory
  }, [filteredAssets, selectedCategory, showTableForCategory])

  const showTable = filterActive || showTableForCategory || Boolean(search.trim())
  const totalPages = Math.ceil(tableSource.length / PAGE_SIZE) || 1
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return tableSource.slice(start, start + PAGE_SIZE)
  }, [tableSource, page])

  useEffect(() => {
    setPage(1)
  }, [search, location, department, selectedCategory, showTableForCategory])

  const locations = useMemo(
    () => Array.from(new Set(assets.map((asset) => normalizeText(asset.location, 'Sede non definita')))).sort((a, b) => a.localeCompare(b, 'it')),
    [assets]
  )

  const departments = useMemo(() => {
    const scoped = location
      ? assets.filter((asset) => normalizeText(asset.location, 'Sede non definita') === location)
      : assets
    return Array.from(new Set(scoped.map((asset) => extractDepartment(asset)))).sort((a, b) => a.localeCompare(b, 'it'))
  }, [assets, location])

  const handleCategorySelect = (category) => {
    setSelectedCategory((prev) => (prev === category ? '' : category))
    setShowTableForCategory(false)
  }

  const handleViewAllCategory = () => {
    if (selectedCategory) setShowTableForCategory(true)
  }

  const handleResetFilters = () => {
    setSearch('')
    setLocation('')
    setDepartment('')
    setSelectedCategory('')
    setShowTableForCategory(false)
  }

  const handleRowClick = (asset) => {
    if (!canEdit) return
    setEditingAsset(asset)
    setModalOpen(true)
  }

  const handleNewAsset = () => {
    setEditingAsset(null)
    setModalOpen(true)
  }

  const visibleRows = showTable ? pagedItems : filteredAssets

  const handleExportCsv = () => {
    const headers = ['NOME', 'MARCA', 'MODELLO', 'CATEGORIA', 'SEDE', 'REPARTO', 'ASSET_TAG', 'SERIALE']
    const rows = visibleRows.map((asset) => ([
      asset.name || '',
      asset.brand || '',
      asset.model || '',
      normalizeText(asset.category, 'ALTRO'),
      normalizeText(asset.location, 'Sede non definita'),
      extractDepartment(asset),
      asset.assetTag || '',
      asset.serialNumber || '',
    ].map(csvEscape).join(';')))
    const csv = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'inventario_filtrato.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Server size={24} className="text-primary-400" />
            Inventario IT
          </h1>
          <p className={ui.subtleText}>Vista semplificata categorie, sedi e reparti</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <FileDown size={16} />
              Export CSV
            </button>
            <button type="button" onClick={handleNewAsset} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors">
              <Plus size={16} />
              Nuovo Asset
            </button>
          </div>
        )}
      </div>

      <InventoryFilters
        search={search}
        location={location}
        department={department}
        locations={locations}
        departments={departments}
        onSearchChange={(e) => setSearch(e.target.value)}
        onLocationChange={(e) => setLocation(e.target.value)}
        onDepartmentChange={(e) => setDepartment(e.target.value)}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div className={`${ui.cardSection} p-8 text-center text-slate-400`}>Caricamento inventario...</div>
      ) : (
        <>
          {!search.trim() && (
            <>
              <CategoryGrid categories={categories} selectedCategory={selectedCategory} onSelectCategory={handleCategorySelect} />
              <CategoryDetail detail={detail} onViewAllCategory={handleViewAllCategory} />
            </>
          )}

          {showTable && (
            <AssetTableSimple
              items={pagedItems}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onRowClick={handleRowClick}
            />
          )}
        </>
      )}

      <AssetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        asset={editingAsset}
        onSaved={loadAssets}
      />
    </div>
  )
}
