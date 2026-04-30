import React from 'react'
import { Building2, ChevronRight, FolderTree } from 'lucide-react'
import { ui } from '../../lib/utils'

export default function CategoryDetail({ detail, onViewAllCategory }) {
  if (!detail) return null

  return (
    <section className={`${ui.cardSection} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{detail.label} - {detail.total} totali</h3>
          <p className="text-xs text-slate-400">Distribuzione per sede e reparto</p>
        </div>
        <button
          type="button"
          onClick={onViewAllCategory}
          className="px-3 py-2 text-xs rounded-lg border border-slate-700 hover:bg-slate-700/30"
        >
          Vedi tutti i {detail.label}
        </button>
      </div>

      <div className="space-y-2">
        {detail.locations.map((location) => (
          <div key={location.name} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-slate-200">
                <Building2 size={14} />
                {location.name}
              </span>
              <span className="text-xs text-slate-300">{location.count}</span>
            </div>
            <div className="mt-2 space-y-1">
              {location.departments.map((department) => (
                <div key={`${location.name}-${department.name}`} className="flex items-center justify-between text-xs text-slate-400 pl-2">
                  <span className="inline-flex items-center gap-1">
                    <ChevronRight size={12} />
                    <FolderTree size={12} />
                    {department.name}
                  </span>
                  <span>{department.count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
