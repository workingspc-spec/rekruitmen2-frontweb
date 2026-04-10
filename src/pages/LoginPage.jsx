// src/pages/LoginPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User } from 'lucide-react'

const USERNAME_HISTORY_KEY = 'usernameHistory'
const MAX_HISTORY = 10

function loadUsernameHistory() {
  try { return JSON.parse(localStorage.getItem(USERNAME_HISTORY_KEY) || '[]') }
  catch { return [] }
}
function saveUsernameHistory(username) {
  if (!username?.trim()) return
  try {
    const current = loadUsernameHistory()
    const updated = [username, ...current.filter(u => u !== username)].slice(0, MAX_HISTORY)
    localStorage.setItem(USERNAME_HISTORY_KEY, JSON.stringify(updated))
  } catch {}
}

// ── Logo — Diperbesar dan tanpa border ───────────────────────────────────────
function AppLogo({ size = 180 }) {
  const [imgOk, setImgOk] = useState(true)
  return imgOk ? (
    <img
      src="/logo_app.png"
      alt="Logo PKAR"
      onError={() => setImgOk(false)}
      style={{ 
        width: size, 
        height: 'auto', 
        maxHeight: size, 
        objectFit: 'contain',
        filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))'
      }}
    />
  ) : (
    <div style={{
      width: 64, height: 64, borderRadius: 18,
      background: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.22)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>P</span>
    </div>
  )
}

// ── Animated Eye (pupil follows mouse) ───────────────────────────────────────
function AnimatedEye({ isVisible, isError, isFocused, onToggle }) {
  const eyeRef   = useRef(null)
  const pupilRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    if (!eyeRef.current || !pupilRef.current) return
    const rect  = eyeRef.current.getBoundingClientRect()
    const cx    = rect.left + rect.width  / 2
    const cy    = rect.top  + rect.height / 2
    const dx    = e.clientX - cx
    const dy    = e.clientY - cy
    const angle = Math.atan2(dy, dx)
    const dist  = Math.min(Math.sqrt(dx * dx + dy * dy), 2.8)
    if (pupilRef.current) {
      pupilRef.current.style.transform =
        `translate(${(Math.cos(angle) * dist).toFixed(2)}px, ${(Math.sin(angle) * dist).toFixed(2)}px)`
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  const col = isError ? '#E11D48' : isFocused ? '#18181b' : '#9CA3AF'

  return (
    <button type="button" ref={eyeRef} onClick={onToggle}
      aria-label={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
      style={{
        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 6,
      }}
    >
      {isVisible ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible' }}>
          <path d="M2 12s5-7 10-7 10 7 10 7-5 7-10 7S2 12 2 12Z"
            stroke={col} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="12" r="3.2" stroke={col} strokeWidth="1.5" fill="none" />
          <circle ref={pupilRef} cx="12" cy="12" r="1.4" fill={col}
            style={{ transition: 'transform 0.05s linear', transformOrigin: '12px 12px' }} />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path d="M4 10s3.5 6 8 6 8-6 8-6" stroke={col} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 16v2.5M7.5 14.5 6 17M16.5 14.5 18 17"
            stroke={col} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

// ── Floating Label Input ──────────────────────────────────────────────────────
function FloatingInput({
  id, label, value, onChange, isError = false,
  isPassword = false, isVisible, onToggle,
  onFocus, onBlur, autoComplete, autoFocus,
  inputRef, onKeyDown,
}) {
  const [focused, setFocused] = useState(false)
  const isUp = focused || value.length > 0

  return (
    <div style={{ position: 'relative', paddingTop: 18 }}>
      <label htmlFor={id} style={{
        position: 'absolute', left: 0,
        top: isUp ? 0 : 26,
        fontSize: isUp ? 11 : 15,
        fontWeight: isUp ? 500 : 400,
        color: isError ? '#E11D48' : focused ? '#18181b' : '#9CA3AF',
        transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'none',
        letterSpacing: isUp ? '0.05em' : 0,
      }}>
        {label}
      </label>

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          id={id}
          type={isPassword ? (isVisible ? 'text' : 'password') : 'text'}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => { setFocused(true); onFocus?.() }}
          onBlur={() => { setFocused(false); onBlur?.() }}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          style={{
            width: '100%', border: 'none', outline: 'none',
            borderBottom: `${focused || isError ? 2 : 1}px solid ${
              isError ? '#E11D48' : focused ? '#18181b' : '#D1D5DB'
            }`,
            background: 'transparent',
            fontSize: 15, paddingBottom: 8,
            paddingRight: isPassword ? 34 : 0,
            color: '#18181b', fontFamily: 'inherit',
            letterSpacing: isPassword && !isVisible ? '0.12em' : 'normal',
            transition: 'border-color 0.18s',
            boxSizing: 'border-box',
          }}
        />
        {isPassword && (
          <AnimatedEye
            isVisible={isVisible} isError={isError}
            isFocused={focused} onToggle={onToggle}
          />
        )}
      </div>
    </div>
  )
}

// ── Custom Checkbox ───────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 7,
      cursor: 'pointer', userSelect: 'none',
    }}>
      <div onClick={onChange} style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        border: `${checked ? 2 : 1}px solid ${checked ? '#18181b' : '#D1D5DB'}`,
        background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border 0.15s',
      }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M2 6 5 9 10 3" stroke="#18181b" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
    </label>
  )
}

// ── Left Decorative Panel ─────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div style={{
      width: '50%', minHeight: '100vh', flexShrink: 0,
      background: '#363435', // <-- Warna background telah diubah sesuai request
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '3rem 2.5rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.07,
        backgroundImage: 'radial-gradient(circle, white 1.2px, transparent 1.2px)',
        backgroundSize: '32px 32px',
      }} />
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 480, height: 480,
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', textAlign: 'center', color: '#fff', maxWidth: 420 }}>
        {/* Logo — Diperbesar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <AppLogo size={180} />
        </div>

        {/* Teks Judul telah diubah */}
        <h1 style={{
          fontSize: 'clamp(22px, 2.5vw, 32px)',
          fontWeight: 800, lineHeight: 1.2,
          margin: '0 0 1rem', letterSpacing: '-0.02em',
        }}>
          Permintaan Karyawan<br />Rekruitmen
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(13px, 1.2vw, 15px)',
          lineHeight: 1.6, margin: '0 0 2.5rem',
        }}>
          Pantau proses rekruitmen, SLA, approval,<br />
          dan KPI dalam satu platform terpadu.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[['SLA','Monitoring'],['KPI','Dashboard'],['Approval','Flow']].map(([a, b]) => (
            <div key={a} style={{
              background: 'rgba(255,255,255,0.09)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 14, padding: '16px 8px',
              backdropFilter: 'blur(4px)'
            }}>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{a}</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '4px 0 0' }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main LoginPage ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [form, setForm]       = useState({ username: '', password: '', expiredDays: null })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [shake, setShake]     = useState(false)

  const [savedUsernames, setSavedUsernames]   = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => { setSavedUsernames(loadUsernameHistory()) }, [])

  useEffect(() => {
    const handler = (e) => {
      if (
        usernameRef.current && !usernameRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const filteredUsernames = form.username
    ? savedUsernames.filter(u => u.toLowerCase().includes(form.username.toLowerCase()))
    : savedUsernames

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 520)
  }

  const handleUsernameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setShowSuggestions(false)
      passwordRef.current?.focus()
    }
  }

  const handlePasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setShowSuggestions(false)
    if (!form.username || !form.password) {
      setError('Username dan password wajib diisi.')
      triggerShake(); return
    }
    setError(''); setLoading(true)
    try {
      await login(form.username, form.password, form.expiredDays)
      saveUsernameHistory(form.username)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali data Anda.')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes shake {
          0%,100% { transform: translateX(0) }
          12%  { transform: translateX(-9px) }
          25%  { transform: translateX(9px) }
          37%  { transform: translateX(-6px) }
          50%  { transform: translateX(6px) }
          62%  { transform: translateX(-3px) }
          75%  { transform: translateX(3px) }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        html, body, #root { height: 100%; margin: 0; padding: 0; }

        .lp-root {
          display: flex; height: 100vh; overflow: hidden;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f5f5f0;
        }

        .lp-left { display: none; width: 50%; flex-shrink: 0; }
        @media (min-width: 900px) { .lp-left { display: flex; } }

        .lp-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: clamp(1.5rem, 4vw, 2.5rem); overflow-y: auto;
          background: #f5f5f0; animation: fadeInUp 0.38s ease;
        }

        .lp-card { width: 100%; max-width: 360px; }

        @media (max-width: 899px) {
          .lp-card {
            background: #fff; border-radius: 20px;
            padding: clamp(1.75rem, 5vw, 2.25rem);
            box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.07);
          }
        }

        .lp-shake { animation: shake 0.52s cubic-bezier(.36,.07,.19,.97) both; }

        .lp-suggestions {
          animation: fadeSlideDown 0.16s ease;
          position: absolute; top: 100%; left: 0; right: 0;
          z-index: 200; background: #fff;
          border: 0.5px solid #e5e7eb; border-radius: 12px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.11);
          overflow: hidden; margin-top: 5px; max-height: 192px; overflow-y: auto;
        }

        .lp-sug-item {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 11px 14px; background: none; border: none;
          cursor: pointer; text-align: left; font-family: inherit;
          font-size: 13px; color: #18181b; font-weight: 500;
          transition: background 0.1s;
        }
        .lp-sug-item:hover { background: #f9fafb; }
        .lp-divider { height: 0.5px; background: #f3f4f6; margin: 0 14px; }

        /* Tombol Login - Lebih elegan dengan shadow */
        .lp-btn {
          width: 100%; height: 48px;
          background: #18181b; color: #fff;
          border: none; border-radius: 999px;
          font-size: 14px; font-weight: 600; letter-spacing: 0.02em;
          cursor: pointer; font-family: inherit;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 12px rgba(24, 24, 27, 0.15);
        }
        .lp-btn:hover:not(:disabled) { 
          background: #27272a; 
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(24, 24, 27, 0.25);
        }
        .lp-btn:active:not(:disabled) { 
          transform: translateY(0); 
          box-shadow: 0 2px 6px rgba(24, 24, 27, 0.2);
        }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

        .lp-spinner {
          width: 16px; height: 16px; flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.65s linear infinite; display: inline-block;
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-left"><LeftPanel /></div>
        <div className="lp-right">
          <div className="lp-card">
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#18181b">
                <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" />
              </svg>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 5px', color: '#18181b', letterSpacing: '-0.02em' }}>
                Welcome back!
              </h2>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                Please enter your details
              </p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div style={{ marginBottom: '1.5rem', position: 'relative' }} ref={usernameRef}>
                <FloatingInput
                  id="username" label="Username" value={form.username}
                  onChange={e => { set('username', e.target.value); setShowSuggestions(true) }}
                  onFocus={() => { if (savedUsernames.length > 0) setShowSuggestions(true) }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                  onKeyDown={handleUsernameKeyDown} isError={!!error} autoComplete="off" autoFocus
                />
                {showSuggestions && filteredUsernames.length > 0 && (
                  <div className="lp-suggestions" ref={dropdownRef}>
                    {filteredUsernames.map((u, i) => (
                      <div key={u}>
                        <button type="button" className="lp-sug-item"
                          onMouseDown={e => {
                            e.preventDefault(); set('username', u); setShowSuggestions(false);
                            setTimeout(() => passwordRef.current?.focus(), 0)
                          }}
                        >
                          <User size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} /> {u}
                        </button>
                        {i < filteredUsernames.length - 1 && <div className="lp-divider" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={shake ? 'lp-shake' : ''} style={{ marginBottom: '1rem' }}>
                <FloatingInput
                  id="password" label="Password" value={form.password}
                  onChange={e => set('password', e.target.value)}
                  onKeyDown={handlePasswordKeyDown} isError={!!error}
                  isPassword isVisible={showPwd} onToggle={() => setShowPwd(p => !p)}
                  autoComplete="current-password" inputRef={passwordRef}
                />
              </div>

              {/* ── Error message - Diperbarui jadi Elegan (Hanya Teks & Ikon) ── */}
              {error && (
                <div className={shake ? 'lp-shake' : ''} style={{
                  fontSize: 13, color: '#E11D48', fontWeight: 600, 
                  marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.75rem', marginTop: '0.25rem' }}>
                <Checkbox checked={form.expiredDays === 3} onChange={() => set('expiredDays', form.expiredDays === 3 ? null : 3)} label="Ingat 3 hari" />
                <Checkbox checked={form.expiredDays === 30} onChange={() => set('expiredDays', form.expiredDays === 30 ? null : 30)} label="Ingat 30 hari" />
              </div>

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? <><span className="lp-spinner" /> Masuk...</> : 'Log In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 11.5, color: '#9CA3AF', marginTop: '1.5rem', marginBottom: 0 }}>
              Belum punya akun? <span style={{ fontWeight: 600, color: '#18181b' }}>Hubungi departemen IT</span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}