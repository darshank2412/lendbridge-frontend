import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

/**
 * Generic pagination hook — wraps React Query with page/size state.
 * queryFn receives { page, size, ...extraParams }
 */
export function usePagination(queryKey, queryFn, options = {}) {
  const { defaultSize = 10, extraParams = {} } = options
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(defaultSize)

  const query = useQuery({
    queryKey: [...queryKey, page, size, extraParams],
    queryFn: () => queryFn({ page, size, ...extraParams }),
    keepPreviousData: true,
  })

  const pageData = query.data?.data?.data

  // Support both paginated Spring Page objects and plain arrays
  const items   = pageData?.content || pageData || []
  const total   = pageData?.totalElements ?? items.length
  const pages   = pageData?.totalPages ?? 1
  const isFirst = pageData?.first ?? page === 0
  const isLast  = pageData?.last ?? page >= pages - 1

  return {
    ...query,
    items,
    total,
    pages,
    page,
    size,
    isFirst,
    isLast,
    setPage,
    setSize,
    nextPage: () => !isLast && setPage(p => p + 1),
    prevPage: () => !isFirst && setPage(p => p - 1),
  }
}

/**
 * PaginationBar component
 */
export function PaginationBar({ page, pages, isFirst, isLast, onPrev, onNext, total, size, onSizeChange }) {
  if (pages <= 1 && total <= size) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-ink-700">
      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span>{total} total</span>
        <span>·</span>
        <select
          className="bg-ink-800 border border-ink-700 rounded-lg px-2 py-1 text-xs text-ink-300 focus:outline-none focus:border-gold-500/50"
          value={size}
          onChange={e => onSizeChange?.(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map(n => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="px-3 py-1.5 text-xs rounded-lg border border-ink-700 text-ink-300
                     hover:border-ink-500 hover:text-ink-100 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all duration-150"
        >
          ← Prev
        </button>
        <span className="px-3 py-1.5 text-xs text-ink-400">
          {page + 1} / {Math.max(1, pages)}
        </span>
        <button
          onClick={onNext}
          disabled={isLast}
          className="px-3 py-1.5 text-xs rounded-lg border border-ink-700 text-ink-300
                     hover:border-ink-500 hover:text-ink-100 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all duration-150"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
