// src/hooks/usePagination.js
import { useState, useMemo, useEffect } from 'react'

/**
 * usePagination — custom hook untuk client-side pagination.
 *
 * Secara otomatis kembali ke halaman 1 setiap kali `data` berubah
 * (misal: ketika filter search/status/period diperbarui).
 *
 * @param {Array}  data          - Array data yang sudah difilter
 * @param {number} [itemsPerPage=15] - Jumlah item per halaman
 * @returns {{ currentPage, setCurrentPage, totalPages, paginatedData, totalItems }}
 */
export function usePagination(data, itemsPerPage = 15) {
  const [currentPage, setCurrentPage] = useState(1)

  // Reset ke halaman 1 setiap kali data berubah (akibat filter)
  useEffect(() => {
    setCurrentPage(1)
  }, [data])

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return data.slice(start, start + itemsPerPage)
  }, [data, currentPage, itemsPerPage])

  // Pastikan currentPage tidak melebihi totalPages saat data berkurang
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems: data.length,
  }
}