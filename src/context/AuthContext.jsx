// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { queryClient } from '../main'

const AuthContext = createContext(null)

/**
 * [FIX-KRITIS] Perubahan autentikasi web:
 *
 * SEBELUMNYA (rentan XSS):
 *   - Token JWT disimpan di localStorage
 *   - localStorage bisa diakses oleh JS manapun, termasuk script injected dari XSS
 *
 * SEKARANG (aman dari XSS):
 *   - Token JWT disimpan di httpOnly cookie (di-set oleh server saat login)
 *   - httpOnly cookie tidak bisa diakses oleh JS sama sekali
 *   - Sesi diverifikasi via GET /auth/me pada saat aplikasi pertama kali dimuat
 *   - Informasi user (nama, role) disimpan di localStorage hanya untuk keperluan
 *     display UI — bukan untuk auth. Jika dimanipulasi, server tetap reject.
 *
 * Android tidak terpengaruh: Android menggunakan Bearer token via DataStore
 * yang dikelola terpisah di AuthInterceptor.kt.
 */

export function AuthProvider({ children }) {
  // User info (untuk display UI) — boleh dari localStorage karena bukan sensitif
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // [FIX-KRITIS] `token` TIDAK lagi diambil dari localStorage.
  // Nilainya hanya ada di React state (in-memory) sebagai flag boolean.
  // Token asli ada di httpOnly cookie yang tidak bisa diakses JS.
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const clearLocalState = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('user')
    // [HAPUS] localStorage.removeItem('token') — token sudah tidak disimpan di sini
    delete api.defaults.headers.common['Authorization']
  }, [])

  const logout = useCallback(async () => {
    try {
      // Hapus httpOnly cookie di server
      await api.post('/auth/logout')
    } catch {
      // Lanjutkan logout meski request gagal
    }
    clearLocalState()
    queryClient.clear()
  }, [clearLocalState])

  // ── Verifikasi sesi saat aplikasi pertama kali dimuat ────────────────────
  // [FIX-KRITIS] Karena token ada di httpOnly cookie (bukan localStorage),
  // kita harus tanya server apakah sesi masih valid.
  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          const userData = res.data.data
          setUser(userData)
          setToken('authenticated') // Flag in-memory — token asli ada di cookie
          localStorage.setItem('user', JSON.stringify(userData))
        } else {
          clearLocalState()
        }
      })
      .catch(() => {
        // Cookie tidak ada atau sudah expired → user belum login
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
          // Token/cookie expired atau tidak valid
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
    // Bersihkan cache akun sebelumnya
    queryClient.clear()

    const { data } = await api.post('/auth/login', { username, password, expiredDays })
    const { user: u } = data.data

    // [FIX-KRITIS] Token dari response body TIDAK disimpan di localStorage.
    // Server sudah set httpOnly cookie secara otomatis.
    // Kita hanya simpan data user (bukan token) untuk keperluan display UI.
    setToken('authenticated')
    setUser(u)
    localStorage.setItem('user', JSON.stringify(u))
    // [HAPUS] localStorage.setItem('token', t) — ini yang dulu rentan XSS

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