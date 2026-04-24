import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

export default function DataTable({
  columns,
  data,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  onPageChange,
  loading,
}) {
  const { page, limit, total, totalPages } = pagination || {}

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-700/50 text-slate-300 uppercase text-xs">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3 font-semibold', col.className)}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  <div className={cn('flex items-center gap-1', col.sortable && 'cursor-pointer hover:text-white select-none')}>
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  Nessun dato trovato
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-slate-700/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
          <div className="text-xs text-slate-400">
            Pagina {page} di {totalPages} — {total} totali
          </div>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => onPageChange(1)} disabled={page <= 1} icon={ChevronsLeft} />
            <PageBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1} icon={ChevronLeft} />
            <PageBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} icon={ChevronRight} />
            <PageBtn onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} icon={ChevronsRight} />
          </div>
        </div>
      )}
    </div>
  )
}

function PageBtn({ onClick, disabled, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
      <Icon size={16} />
    </button>
  )
}

