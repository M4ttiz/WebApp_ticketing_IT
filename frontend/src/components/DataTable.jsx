import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-react'
import { cn, ui } from '../lib/utils'

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
    <div className={cn(ui.card, 'overflow-hidden')}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] text-text-primary">
          <thead className="border-b border-border-subtle bg-surface-card">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary',
                    idx === 0 && 'font-bold text-text-primary',
                    col.className
                  )}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  <div className={cn('flex items-center gap-1', col.sortable && 'cursor-pointer select-none hover:text-text-primary')}>
                    {col.label}
                    {col.sortable && sortBy === col.key && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle/80">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-surface-hover" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-text-secondary">
                  Nessun dato trovato
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i} className="border-b border-border-subtle/80 transition-colors duration-150 hover:bg-[#1A1D25]">
                  {columns.map((col, idx) => (
                    <td key={col.key} className={cn('px-4 py-3.5 text-text-primary', idx === 0 && 'font-semibold', col.className)}>
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
        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
          <div className="text-xs text-text-secondary">
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
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-ds p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <Icon size={16} />
    </button>
  )
}
