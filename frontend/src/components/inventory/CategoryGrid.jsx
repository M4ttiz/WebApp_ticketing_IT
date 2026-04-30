import React from 'react'
import { Cpu, Laptop, Monitor, Network, Printer, Router, Server, Smartphone } from 'lucide-react'
import { ui } from '../../lib/utils'

const iconByCategory = {
  LAPTOP: Laptop,
  DESKTOP: Monitor,
  MONITOR: Monitor,
  STAMPANTE: Printer,
  ACCESS_POINT: Network,
  AP: Network,
  SWITCH: Router,
  ROUTER: Router,
  SERVER: Server,
  NAS: Cpu,
  TELEFONO: Smartphone,
}

function getCategoryIcon(category) {
  return iconByCategory[category] || Cpu
}

export default function CategoryGrid({ categories, selectedCategory, onSelectCategory }) {
  return (
    <section className={`${ui.cardSection} p-4`}>
      <h2 className="text-sm font-semibold text-slate-100 mb-3">Cosa abbiamo in azienda</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {categories.map((item) => {
          const Icon = getCategoryIcon(item.category)
          const active = selectedCategory === item.category
          return (
            <button
              key={item.category}
              type="button"
              onClick={() => onSelectCategory(item.category)}
              className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                active
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-slate-700/70 bg-slate-800/40 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon size={18} className="text-slate-300" />
                <span className="text-2xl font-semibold text-slate-100">{item.count}</span>
              </div>
              <p className="mt-2 text-sm text-slate-200">{item.label}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
