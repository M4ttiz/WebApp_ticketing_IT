import React from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { ui } from '../../lib/utils'

export default function InventoryFilters({
  search,
  location,
  department,
  locations,
  departments,
  onSearchChange,
  onLocationChange,
  onDepartmentChange,
  onReset,
}) {
  return (
    <div className={`${ui.cardSection} p-3 sticky top-3 z-20`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={onSearchChange}
            placeholder="Cerca nome, modello, serial, asset tag..."
            className={`${ui.input} pl-9`}
          />
        </div>

        <select value={location} onChange={onLocationChange} className={ui.select}>
          <option value="">Tutte le sedi</option>
          {locations.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <div className="flex gap-2">
          <select value={department} onChange={onDepartmentChange} className={`${ui.select} flex-1`}>
            <option value="">Tutti i reparti</option>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
