import React from 'react'
import { ui } from '../../lib/utils'

export default function AssetTableSimple({ items, page, totalPages, onPageChange, onRowClick }) {
  return (
    <section className={`${ui.cardSection} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-slate-900/80">
            <tr className="text-left text-slate-400 border-b border-slate-700/70">
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Marca</th>
              <th className="px-3 py-2 font-medium">Modello</th>
              <th className="px-3 py-2 font-medium">Sede</th>
              <th className="px-3 py-2 font-medium">Reparto</th>
              <th className="px-3 py-2 font-medium">Asset Tag</th>
            </tr>
          </thead>
          <tbody>
            {items.map((asset) => (
              <tr
                key={asset.id}
                onClick={() => onRowClick(asset)}
                className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors cursor-pointer"
              >
                <td className="px-3 py-2 text-slate-100">{asset.name || '-'}</td>
                <td className="px-3 py-2 text-slate-300">{asset.category || '-'}</td>
                <td className="px-3 py-2 text-slate-300">{asset.brand || '-'}</td>
                <td className="px-3 py-2 text-slate-300">{asset.model || '-'}</td>
                <td className="px-3 py-2 text-slate-300">{asset.location || '-'}</td>
                <td className="px-3 py-2 text-slate-300">{asset.department || asset.assignedTo || '-'}</td>
                <td className="px-3 py-2 text-slate-300">{asset.assetTag || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-3 py-3 border-t border-slate-700/60">
        <p className="text-xs text-slate-400">Pagina {page} di {Math.max(totalPages, 1)}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs rounded border border-slate-700 disabled:opacity-40 hover:bg-slate-700/40"
          >
            Precedente
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs rounded border border-slate-700 disabled:opacity-40 hover:bg-slate-700/40"
          >
            Successiva
          </button>
        </div>
      </div>
    </section>
  )
}
