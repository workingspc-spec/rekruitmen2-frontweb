import { useState, useMemo, useEffect, useRef } from 'react'

/**
 * usePagination — custom hook untuk client-side pagination.
 */
export function usePagination(data, itemsPerPage = 15, resetKey = null, initialPage = 1) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  
  // ✅ PERUBAHAN: Gunakan prevResetKey untuk melacak filter sebelumnya
  const prevResetKey = useRef(resetKey) 

  // Reset ke halaman 1 HANYA jika resetKey (filter) benar-benar berubah
  useEffect(() => {
    if (prevResetKey.current !== resetKey) {
      setCurrentPage(1)
      prevResetKey.current = resetKey // update ref ke nilai terbaru
    }
  }, [resetKey])

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return data.slice(start, start + itemsPerPage)
  }, [data, currentPage, itemsPerPage])

  // Guard: jika halaman melebihi total (data berkurang saat loading), kembali ke halaman terakhir
  useEffect(() => {
    if (data.length > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage, data.length])

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems: data.length,
  }
}