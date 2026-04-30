import React from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { ui } from '../../lib/utils'

export default function InventoryFilters({
  filters,
  options,
  onSearchChange,
  onLocationChange,
  onDepartmentChange,
  onCategoryChange,
  onStatusChange,
  onReset,
}) {
  return (
    <div className={`${ui.cardSection} p-3 sticky top-3 z-20`}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        <div className="relative xl:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={onSearchChange}
            placeholder="Cerca nome o modello..."
            className={`${ui.input} pl-9`}
          />
        </div>

        <select value={filters.location} onChange={onLocationChange} className={ui.select}>
          <option value="">Tutte le sedi</option>
          {options.locations.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select value={filters.department} onChange={onDepartmentChange} className={ui.select}>
          <option value="">Tutti i reparti</option>
          {options.departments.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select value={filters.category} onChange={onCategoryChange} className={ui.select}>
          <option value="">Tutte le categorie</option>
          {options.categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <div className="flex gap-2">
          <select value={filters.status} onChange={onStatusChange} className={`${ui.select} flex-1`}>
            <option value="">Tutti gli stati</option>
            {options.statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            <RotateCcw size={14} />
            Azzera
          </button>
        </div>
      </div>
    </div>
  )
}
