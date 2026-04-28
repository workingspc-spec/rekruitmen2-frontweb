// src/components/MainLayout.jsx
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useSessionTimeout } from '../hooks/useSessionTimeout'

export default function MainLayout({ children }) {
  // Default collapsed on screens < 1024px (tablet)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 1024
    return false
  })

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Deteksi inaktivitas: warning di 25 menit, auto-logout di 30 menit.
  useSessionTimeout({ warningMinutes: 25, logoutMinutes: 30 })

  // ── Scroll Restoration ────────────────────────────────────────────────────
  // Setiap history entry di React Router punya `location.key` yang unik dan
  // konsisten — saat back/forward, key yang sama dikembalikan.
  // Kita pakai key ini sebagai identitas posisi scroll di sessionStorage.
  const mainRef  = useRef(null)
  const location = useLocation()

  useEffect(() => {
    const el = mainRef.current
    if (!el) return

    const storageKey = `scroll:${location.key}`

    // Coba pulihkan posisi scroll untuk history entry ini.
    // setTimeout 100ms: memberi waktu list merender dari React Query cache
    // sebelum scrollTop di-set (tanpa delay, height konten belum ada).
    const saved = sessionStorage.getItem(storageKey)
    let timer
    if (saved !== null) {
      timer = setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = parseInt(saved, 10)
        }
      }, 100)
    } else {
      // Navigasi baru (bukan back/forward) → selalu mulai dari atas
      el.scrollTop = 0
    }

    // Simpan posisi scroll saat user men-scroll
    const handleScroll = () => {
      sessionStorage.setItem(storageKey, String(el.scrollTop))
    }
    el.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', handleScroll)
    }
  }, [location.key])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(v => !v)}
      />
      <main ref={mainRef} className="flex-1 h-full overflow-y-auto min-w-0">
        <div className="p-6 max-w-7xl mx-auto page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}