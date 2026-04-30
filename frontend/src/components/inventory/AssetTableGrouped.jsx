import React from 'react'
import { Edit3, Trash2 } from 'lucide-react'
import { ui } from '../../lib/utils'

function statusBadgeClass(status) {
  if (status === 'GUASTO' || status === 'DISPOSED' || status === 'DISMESSO') return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  if (status === 'IN_MANUTENZIONE' || status === 'MAINTENANCE') return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (status === 'IN_USO' || status === 'IN_USE') return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
}

function statusLabel(status) {
  if (status === 'IN_MANUTENZIONE' || status === 'MAINTENANCE') return 'In manutenzione'
  if (status === 'IN_USO' || status === 'IN_USE') return 'In uso'
  if (status === 'DISPOSED' || status === 'DISMESSO') return 'Dismesso'
  if (status === 'GUASTO') return 'Guasto'
  return 'Disponibile'
}

export default function AssetTableGrouped({
  groups,
  page,
  totalPages,
  onPageChange,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) {
  return (
    <section className={`${ui.cardSection} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-900/80">
            <tr className="text-left text-slate-400 border-b border-slate-700/70">
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Marca/Modello</th>
              <th className="px-3 py-2 font-medium">Sede</th>
              <th className="px-3 py-2 font-medium">Reparto</th>
              <th className="px-3 py-2 font-medium">Stato</th>
              <th className="px-3 py-2 font-medium text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((locationGroup) => (
              <React.Fragment key={locationGroup.name}>
                <tr className="bg-slate-800/60 border-b border-slate-700/60">
                  <td className="px-3 py-2 font-semibold text-slate-100" colSpan={7}>
                    {locationGroup.name} · {locationGroup.count} asset
                  </td>
                </tr>
                {locationGroup.departments.map((departmentGroup) => (
                  <React.Fragment key={`${locationGroup.name}-${departmentGroup.name}`}>
                    <tr className="bg-slate-900/40 border-b border-slate-700/40">
                      <td className="px-3 py-2 text-xs text-slate-300 pl-6" colSpan={7}>
                        {departmentGroup.name} · {departmentGroup.assets.length} asset
                      </td>
                    </tr>
                    {departmentGroup.assets.map((asset) => (
                      <tr key={asset.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                        <td className="px-3 py-2 font-medium">{asset.name || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{asset.category || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{[asset.brand, asset.model].filter(Boolean).join(' ') || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{asset.location || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{asset.assignedTo || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded border ${statusBadgeClass(asset.status)}`}>
                            {statusLabel(asset.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <button type="button" onClick={() => onEdit(asset)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-700/40">
                                <Edit3 size={12} />
                                Modifica
                              </button>
                            )}
                            {canDelete && (
                              <button type="button" onClick={() => onDelete(asset)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-rose-500/30 text-rose-200 hover:bg-rose-500/10">
                                <Trash2 size={12} />
                                Elimina
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
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
