// src/components/PaginationControls.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * PaginationControls — komponen navigasi halaman yang konsisten di seluruh aplikasi.
 *
 * Menampilkan:
 *  - Info "Halaman X dari Y (Z total)"
 *  - Tombol Prev / halaman number / Next
 *
 * Props:
 *  @param {number}   currentPage
 *  @param {number}   totalPages
 *  @param {number}   totalItems
 *  @param {Function} onPageChange  - (newPage: number) => void
 *  @param {number}   [itemsPerPage]  - opsional, untuk menampilkan info range
 */
export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemsPerPage,
}) {
  if (totalPages <= 1 && totalItems === 0) return null
  if (totalPages <= 1) return (
    <p className="text-xs text-slate-400 text-center py-2">
      Menampilkan {totalItems} data
    </p>
  )

  const startItem = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null
  const endItem   = itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null

  // Bangun array halaman yang ditampilkan (maks 5 page number)
  const pages = buildPageNumbers(currentPage, totalPages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2">
      {/* Info teks */}
      <p className="text-xs text-slate-400 order-2 sm:order-1">
        {startItem && endItem
          ? <>{startItem}–{endItem} dari <span className="font-semibold text-slate-600">{totalItems}</span> data</>
          : <>Halaman <span className="font-semibold text-slate-600">{currentPage}</span> dari {totalPages} ({totalItems} total)</>
        }
      </p>

      {/* Navigasi */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            currentPage === 1
              ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
              : 'border-slate-200 text-slate-600 hover:border-sapphire hover:text-sapphire bg-white'
          )}
        >
          <ChevronLeft size={13} />
          Sebelumnya
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-xs text-slate-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={clsx(
                  'w-8 h-8 rounded-lg text-xs font-semibold transition-all',
                  p === currentPage
                    ? 'bg-sapphire text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            currentPage === totalPages
              ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
              : 'border-slate-200 text-slate-600 hover:border-sapphire hover:text-sapphire bg-white'
          )}
        >
          Selanjutnya
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

/**
 * Bangun array nomor halaman dengan ellipsis.
 * Contoh: [1, '...', 4, 5, 6, '...', 20]
 */
function buildPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages = []
  const delta = 1 // halaman di kiri/kanan current

  const left  = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  pages.push(1)

  if (left > 2) pages.push('...')

  for (let i = left; i <= right; i++) pages.push(i)

  if (right < total - 1) pages.push('...')

  pages.push(total)

  return pages
}