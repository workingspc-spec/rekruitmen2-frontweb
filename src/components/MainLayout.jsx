// src/components/MainLayout.jsx
import { useState, useEffect } from 'react'
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
  // Sesuaikan dengan masa berlaku cookie session di backend.
  useSessionTimeout({ warningMinutes: 25, logoutMinutes: 30 })

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(v => !v)}
      />
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        <div className="p-6 max-w-7xl mx-auto page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}