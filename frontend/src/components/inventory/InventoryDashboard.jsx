import React from 'react'
import { AlertTriangle, Boxes, Building2, ChevronDown, ChevronRight, PackageCheck, Wrench } from 'lucide-react'
import { ui } from '../../lib/utils'

const statusClasses = {
  available: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  inUse: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  warehouse: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  maintenance: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
}

const kpiIcons = {
  total: Boxes,
  inUse: PackageCheck,
  warehouse: Building2,
  available: Wrench,
}

export default function InventoryDashboard({
  kpis,
  locationTree,
  expandedLocations,
  onToggleLocation,
  onSelectNode,
  criticalFilterEnabled,
  onToggleCriticalFilter,
}) {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {Object.entries(kpis).map(([key, item]) => {
          const Icon = kpiIcons[key]
          return (
            <div key={key} className={`${ui.cardSection} p-3`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{item.label}</p>
                <Icon size={16} className="text-slate-300" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
          )
        })}
      </div>

      <div className={`${ui.cardSection} p-3`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Mappa sede e reparto</h3>
          <button
            type="button"
            onClick={onToggleCriticalFilter}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${criticalFilterEnabled ? 'bg-rose-500/20 text-rose-200 border-rose-500/40' : 'bg-slate-700 text-slate-200 border-slate-600'}`}
          >
            <AlertTriangle size={13} />
            Sotto scorta
          </button>
        </div>
        <div className="space-y-2">
          {locationTree.map((location) => {
            const isOpen = expandedLocations.has(location.name)
            return (
              <div key={location.name} className="rounded-lg border border-slate-700/60 bg-slate-900/30">
                <button
                  type="button"
                  onClick={() => onToggleLocation(location.name)}
                  className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800/60"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {location.name}
                  </span>
                  <span className="text-xs text-slate-300">{location.count} asset</span>
                </button>
                {isOpen && (
                  <div className="px-2 pb-2 space-y-1">
                    {location.departments.map((department) => (
                      <button
                        key={`${location.name}-${department.name}`}
                        type="button"
                        onClick={() => onSelectNode(location.name, department.name)}
                        className="w-full px-3 py-1.5 rounded-md text-xs flex items-center justify-between hover:bg-slate-800"
                      >
                        <span>{department.name}</span>
                        <span className={`px-2 py-0.5 rounded border ${department.critical ? 'bg-rose-500/20 text-rose-200 border-rose-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                          {department.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex gap-2 mt-3">
          <span className={`px-2 py-1 text-xs rounded border ${statusClasses.maintenance}`}>In manutenzione</span>
          <span className="px-2 py-1 text-xs rounded border bg-rose-500/15 text-rose-300 border-rose-500/30">Sotto scorta</span>
        </div>
      </div>
    </section>
  )
}
