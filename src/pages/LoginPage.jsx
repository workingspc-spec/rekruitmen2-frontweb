// src/pages/LoginPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, LogIn, User } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Konstanta Storage Key ─────────────────────────────────────────────────────
const USERNAME_HISTORY_KEY = 'usernameHistory'
const MAX_HISTORY = 10

/** Ambil riwayat username dari localStorage — identik Android UserSession.getSavedUsernames() */
function loadUsernameHistory() {
  try {
    return JSON.parse(localStorage.getItem(USERNAME_HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

/** Simpan username ke riwayat — identik Android UserSession.saveUsernameToHistory() */
function saveUsernameHistory(username) {
  if (!username || !username.trim()) return
  try {
    const current = loadUsernameHistory()
    const updated = [username, ...current.filter(u => u !== username)].slice(0, MAX_HISTORY)
    localStorage.setItem(USERNAME_HISTORY_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({ username: '', password: '', expiredDays: null })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // ── Username history — identik Android savedUsernames StateFlow ──────────────
  const [savedUsernames, setSavedUsernames]   = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const usernameRef = useRef(null)
  const suggestRef  = useRef(null)

  useEffect(() => {
    setSavedUsernames(loadUsernameHistory())
  }, [])

  // Tutup suggestions saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        usernameRef.current && !usernameRef.current.contains(e.target) &&
        suggestRef.current  && !suggestRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Filter suggestions berdasarkan input yang sedang diketik
  const filteredUsernames = form.username
    ? savedUsernames.filter(u => u.toLowerCase().includes(form.username.toLowerCase()))
    : savedUsernames

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Username dan password wajib diisi.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password, form.expiredDays)
      // Simpan username ke riwayat setelah login berhasil
      // Identik Android: userSession.saveUsernameToHistory(_username.value)
      saveUsernameHistory(form.username)
      setSavedUsernames(loadUsernameHistory())
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa kembali data Anda.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const selectUsername = (username) => {
    setForm(f => ({ ...f, username }))
    setShowSuggestions(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy via-sapphire to-blue-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <span className="font-display font-black text-4xl">P</span>
          </div>
          <h1 className="font-display font-black text-4xl leading-tight mb-4">
            Sistem Manajemen<br />Rekruitmen
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
            Pantau proses rekruitmen, SLA, approval, dan KPI dalam satu platform terpadu.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[['SLA', 'Monitoring'], ['KPI', 'Dashboard'], ['Approval', 'Flow']].map(([a, b]) => (
              <div key={a} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="font-display font-bold text-xl">{a}</p>
                <p className="text-blue-200 text-xs mt-0.5">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 bg-sapphire rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-display font-black text-2xl">P</span>
            </div>
          </div>

          <h2 className="font-display font-bold text-2xl text-navy mb-1">Selamat Datang</h2>
          <p className="text-slate-500 text-sm mb-8">Masuk ke akun PKAR Anda</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Username + Suggestions ─────────────────────────────────────────── */}
            <div>
              <label className="label">Username</label>

              {/* Suggestions dropdown — identik Android savedUsernames dropdown */}
              {showSuggestions && filteredUsernames.length > 0 && (
                <div
                  ref={suggestRef}
                  className="mb-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto"
                >
                  {filteredUsernames.map((u, i) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => selectUsername(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-slate-50 transition-colors"
                    >
                      <User size={15} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">{u}</span>
                    </button>
                  ))}
                </div>
              )}

              <input
                ref={usernameRef}
                className="input"
                type="text"
                placeholder="Masukkan NIK / username"
                value={form.username}
                onChange={e => {
                  set('username', e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => {
                  if (savedUsernames.length > 0) setShowSuggestions(true)
                }}
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* ── Password ── */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPwd(p => !p)}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* ── Remember Me — identik Android RememberMeOption ── */}
            <div className="flex gap-4">
              {[
                { days: 3,  label: 'Ingat 3 hari' },
                { days: 30, label: 'Ingat 30 hari' },
              ].map(({ days, label }) => (
                <label key={days} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-sapphire"
                    checked={form.expiredDays === days}
                    onChange={e => set('expiredDays', e.target.checked ? days : null)}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* ── Error Display ── */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            {/* ── Submit ── */}
            <button
              type="submit"
              className="btn-primary w-full justify-center h-11 text-base mt-2"
              disabled={loading}
            >
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Masuk...</span>
                : <><LogIn size={18} /> Masuk</>
              }
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-8">
            Belum punya akun? Hubungi departemen IT.
          </p>
        </div>
      </div>
    </div>
  )
}