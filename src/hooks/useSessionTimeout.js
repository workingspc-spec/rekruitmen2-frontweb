/**
 * useSessionTimeout — Deteksi inaktivitas dan warning sebelum session expired.
 *
 * Cara pakai: pasang di MainLayout.jsx
 *   useSessionTimeout({ warningMinutes: 25, logoutMinutes: 30 })
 *
 * Flow:
 *   User tidak aktif warningMinutes → toast warning muncul
 *   User tidak aktif logoutMinutes  → auto logout + redirect /login
 *   User melakukan aktivitas apapun → timer reset
 */

import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function useSessionTimeout({
  warningMinutes = 25,
  logoutMinutes  = 30,
} = {}) {
  const { token, logout } = useAuth()
  const navigate          = useNavigate()
  const warnTimer         = useRef(null)
  const logoutTimer       = useRef(null)
  const warnToastId       = useRef(null)

  const clearTimers = useCallback(() => {
    clearTimeout(warnTimer.current)
    clearTimeout(logoutTimer.current)
    if (warnToastId.current) {
      toast.dismiss(warnToastId.current)
      warnToastId.current = null
    }
  }, [])

  const resetTimers = useCallback(() => {
    if (!token) return
    clearTimers()

    const remainingMinutes = logoutMinutes - warningMinutes

    // Timer 1: Tampilkan warning sebelum logout
    warnTimer.current = setTimeout(() => {
      warnToastId.current = toast(
        `⏰ Sesi Anda akan berakhir dalam ${remainingMinutes} menit karena tidak ada aktivitas.`,
        {
          duration: remainingMinutes * 60 * 1000,
          icon: '⚠️',
          style: {
            background: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a',
          },
        }
      )
    }, warningMinutes * 60 * 1000)

    // Timer 2: Auto logout
    logoutTimer.current = setTimeout(async () => {
      clearTimers()
      toast.error('Sesi telah berakhir. Silakan login kembali.')
      await logout()
      navigate('/login', { replace: true })
    }, logoutMinutes * 60 * 1000)
  }, [token, warningMinutes, logoutMinutes, clearTimers, logout, navigate])

  useEffect(() => {
    if (!token) {
      clearTimers()
      return
    }

    const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    const handleActivity  = () => resetTimers()

    // Mulai timer saat pertama kali
    resetTimers()

    // Reset timer setiap ada aktivitas user
    ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, handleActivity, { passive: true })
    )

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, handleActivity)
      )
    }
  }, [token, resetTimers, clearTimers])
}