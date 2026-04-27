// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { queryClient } from '../main'
import {
  saveUserToStorage,
  loadUserFromStorage,
  clearUserFromStorage,
} from '../utils/security'

const AuthContext = createContext(null)

/**
 * AuthProvider — Mengelola state autentikasi berbasis httpOnly cookie.
 *
 * Perubahan keamanan dari versi lama:
 *  1. Token TIDAK disimpan di localStorage (rentan XSS) → httpOnly cookie
 *  2. Data user disimpan di sessionStorage (bukan localStorage):
 *     - sessionStorage auto-clear saat tab/browser ditutup
 *     - Key yang tidak deskriptif mempersulit script oportunistik
 *     - Hanya menyimpan field yang diperlukan untuk display UI
 *  3. is_hrd tidak disimpan dengan key yang obvious
 */
export function AuthProvider({ children }) {
  // Load data user dari sessionStorage (atau localStorage lama sebagai fallback)
  const [user, setUser] = useState(() => loadUserFromStorage())

  // `token` hanya ada di in-memory React state sebagai flag boolean.
  // Token asli ada di httpOnly cookie yang tidak bisa diakses JS.
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const clearLocalState = useCallback(() => {
    setToken(null)
    setUser(null)
    clearUserFromStorage()          // bersihkan sessionStorage + localStorage lama
    delete api.defaults.headers.common['Authorization']
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Lanjutkan logout meski request gagal
    }
    clearLocalState()
    queryClient.clear()
  }, [clearLocalState])

  // ── Verifikasi sesi saat app pertama kali dimuat ──────────────────────────
  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          const userData = res.data.data
          setUser(userData)
          setToken('authenticated')
          saveUserToStorage(userData)   // simpan ke sessionStorage dengan key samar
        } else {
          clearLocalState()
        }
      })
      .catch(() => {
        // Cookie tidak ada atau expired → belum login
        clearLocalState()
      })
      .finally(() => {
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Global 401 interceptor ────────────────────────────────────────────────
  useEffect(() => {
    const id = api.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          clearLocalState()
          queryClient.clear()
        }
        return Promise.reject(err)
      }
    )
    return () => api.interceptors.response.eject(id)
  }, [clearLocalState])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password, expiredDays) => {
    queryClient.clear()

    const { data } = await api.post('/auth/login', { username, password, expiredDays })
    const { user: u } = data.data

    // Token dari response body TIDAK disimpan — server sudah set httpOnly cookie.
    // Hanya simpan data user (bukan token) ke sessionStorage untuk display UI.
    setToken('authenticated')
    setUser(u)
    saveUserToStorage(u)            // sessionStorage dengan key samar

    return u
  }, [])

  const isHrd = user?.is_hrd === 1

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isHrd }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}