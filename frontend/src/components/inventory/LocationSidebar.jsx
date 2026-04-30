import React from 'react'
import { Building2, ChevronRight, MapPin } from 'lucide-react'
import { ui } from '../../lib/utils'

export default function LocationSidebar({
  tree,
  selectedLocation,
  selectedDepartment,
  onLocationSelect,
  onDepartmentSelect,
}) {
  return (
    <aside className={`${ui.cardSection} p-3 h-fit`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-100">Navigazione sedi</h3>
      </div>
      <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
        {tree.map((location) => {
          const locationActive = selectedLocation === location.name
          return (
            <div key={location.name} className="rounded-lg border border-slate-700/60 bg-slate-900/40">
              <button
                type="button"
                onClick={() => onLocationSelect(location.name)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  locationActive ? 'bg-primary-600/20 text-primary-200' : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Building2 size={14} />
                  {location.name}
                </span>
                <span className="text-xs text-slate-400">{location.count}</span>
              </button>

              <div className="px-2 pb-2 space-y-1">
                {location.departments.map((department) => {
                  const active = locationActive && selectedDepartment === department.name
                  return (
                    <button
                      key={`${location.name}-${department.name}`}
                      type="button"
                      onClick={() => onDepartmentSelect(location.name, department.name)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                        active ? 'bg-primary-500/20 text-primary-200' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <ChevronRight size={12} />
                        <MapPin size={12} />
                        {department.name}
                      </span>
                      <span className="text-slate-400">{department.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
