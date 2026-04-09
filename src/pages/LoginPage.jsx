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

// ── Animated Eye ──────────────────────────────────────────────────────────────
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
    pupilRef.current.style.transform =
      `translate(${(Math.cos(angle) * dist).toFixed(2)}px, ${(Math.sin(angle) * dist).toFixed(2)}px)`
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  const col = isError ? '#DC2626' : isFocused ? '#18181b' : '#9CA3AF'

  return (
    <button type="button" ref={eyeRef} onClick={onToggle}
      aria-label={isVisible ? 'Sembunyikan' : 'Tampilkan'}
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
  onFocus, onBlur, autoComplete, autoFocus, inputRef,
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
        color: isError ? '#DC2626' : focused ? '#18181b' : '#9CA3AF',
        transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'none',
        letterSpacing: isUp ? '0.05em' : 0,
        whiteSpace: 'nowrap',
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
          onFocus={() => { setFocused(true); onFocus?.() }}
          onBlur={() => { setFocused(false); onBlur?.() }}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          style={{
            width: '100%', border: 'none', outline: 'none',
            borderBottom: `${focused || isError ? 2 : 1}px solid ${
              isError ? '#DC2626' : focused ? '#18181b' : '#D1D5DB'
            }`,
            background: 'transparent',
            fontSize: 15, paddingBottom: 8,
            paddingRight: isPassword ? 34 : 0,
            color: '#18181b',
            fontFamily: 'inherit',
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
      flex: '0 0 48%', minHeight: '100vh',
      background: 'linear-gradient(145deg, #0a1628 0%, #0F52BA 55%, #2563eb 100%)',
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
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(99,179,237,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', textAlign: 'center', color: '#fff', maxWidth: 340 }}>
        <div style={{
          width: 64, height: 64,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 2rem', border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>P</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(22px, 2.2vw, 30px)',
          fontWeight: 800, lineHeight: 1.25,
          margin: '0 0 1rem', letterSpacing: '-0.02em',
        }}>
          Sistem Manajemen<br />Rekruitmen
        </h1>

        <p style={{
          color: '#93c5fd', fontSize: 'clamp(13px, 1.1vw, 15px)',
          lineHeight: 1.75, margin: '0 0 2.5rem',
        }}>
          Pantau proses rekruitmen, SLA, approval,<br />
          dan KPI dalam satu platform terpadu.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[['SLA','Monitoring'],['KPI','Dashboard'],['Approval','Flow']].map(([a,b]) => (
            <div key={a} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '14px 8px',
            }}>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{a}</p>
              <p style={{ color: '#93c5fd', fontSize: 11, margin: '3px 0 0' }}>{b}</p>
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

  const usernameRef  = useRef(null)
  const dropdownRef  = useRef(null)

  useEffect(() => { setSavedUsernames(loadUsernameHistory()) }, [])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        usernameRef.current  && !usernameRef.current.contains(e.target) &&
        dropdownRef.current  && !dropdownRef.current.contains(e.target)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lp-root {
          min-height: 100vh; display: flex;
          background: #f8f8f6;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .lp-left { display: none; }
        @media (min-width: 900px) {
          .lp-left { display: flex; }
          .lp-right { background: #f8f8f6; }
        }
        .lp-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: clamp(1.5rem, 4vw, 3rem);
          background: #f8f8f6;
          animation: fadeIn 0.35s ease;
        }
        .lp-card {
          width: 100%; max-width: 360px;
          background: #ffffff;
          border-radius: 20px;
          padding: clamp(1.75rem, 4vw, 2.5rem) clamp(1.5rem, 4vw, 2.25rem);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06);
        }
        @media (min-width: 900px) {
          .lp-card {
            box-shadow: none;
            border-radius: 0;
            background: transparent;
            padding: 0;
          }
        }
        .lp-shake { animation: shake 0.52s cubic-bezier(.36,.07,.19,.97) both; }
        .lp-suggestions {
          animation: fadeSlideDown 0.16s ease;
          position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
          background: #fff;
          border: 0.5px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
          overflow: hidden;
          margin-top: 4px;
          max-height: 188px;
          overflow-y: auto;
        }
        .lp-sug-item {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 10px 14px; background: none; border: none;
          cursor: pointer; text-align: left; font-family: inherit;
          font-size: 13px; color: #18181b; font-weight: 500;
          transition: background 0.1s;
        }
        .lp-sug-item:hover { background: #f3f4f6; }
        .lp-divider { height: 0.5px; background: #f3f4f6; margin: 0 14px; }
        .lp-btn {
          width: 100%; height: 46px;
          background: #18181b; color: #fff;
          border: none; border-radius: 999px;
          font-size: 14px; font-weight: 600; letter-spacing: 0.01em;
          cursor: pointer; font-family: inherit;
          transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .lp-btn:hover:not(:disabled) { background: #000; }
        .lp-btn:active:not(:disabled) { transform: scale(0.985); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .lp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.65s linear infinite; display: inline-block; flex-shrink: 0;
        }
        .lp-input-wrapper { position: relative; }
      `}</style>

      <div className="lp-root">
        {/* Left panel */}
        <div className="lp-left" style={{ flex: '0 0 48%' }}>
          <LeftPanel />
        </div>

        {/* Right panel */}
        <div className="lp-right">
          <div className="lp-card">

            {/* Sparkle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#18181b">
                <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" />
              </svg>
            </div>

            {/* Heading */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: 24, fontWeight: 700, margin: '0 0 5px',
                color: '#18181b', letterSpacing: '-0.02em',
              }}>
                Welcome back!
              </h2>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                Please enter your details
              </p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">

              {/* ── Username + dropdown BAWAH input ── */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="lp-input-wrapper" ref={usernameRef}>
                  <FloatingInput
                    id="username"
                    label="Username"
                    value={form.username}
                    onChange={e => {
                      set('username', e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => {
                      if (savedUsernames.length > 0) setShowSuggestions(true)
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                    isError={!!error}
                    autoComplete="off"
                    autoFocus
                  />

                  {/* Dropdown BAWAH — tidak menabrak heading */}
                  {showSuggestions && filteredUsernames.length > 0 && (
                    <div className="lp-suggestions" ref={dropdownRef}>
                      {filteredUsernames.map((u, i) => (
                        <div key={u}>
                          <button
                            type="button"
                            className="lp-sug-item"
                            onMouseDown={e => {
                              e.preventDefault()
                              set('username', u)
                              setShowSuggestions(false)
                            }}
                          >
                            <User size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                            {u}
                          </button>
                          {i < filteredUsernames.length - 1 && (
                            <div className="lp-divider" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Password ── */}
              <div
                className={shake ? 'lp-shake' : ''}
                style={{ marginBottom: '1rem' }}
              >
                <FloatingInput
                  id="password"
                  label="Password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  isError={!!error}
                  isPassword isVisible={showPwd}
                  onToggle={() => setShowPwd(p => !p)}
                  autoComplete="current-password"
                />
              </div>

              {/* ── Error ── */}
              {error && (
                <div className={shake ? 'lp-shake' : ''} style={{
                  fontSize: 11.5, color: '#DC2626',
                  background: '#FEF2F2', border: '0.5px solid #FECACA',
                  borderRadius: 8, padding: '8px 12px', marginBottom: '1rem',
                }}>
                  {error}
                </div>
              )}

              {/* ── Remember Me ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                marginBottom: '1.75rem', marginTop: '0.25rem',
              }}>
                <Checkbox
                  checked={form.expiredDays === 3}
                  onChange={() => set('expiredDays', form.expiredDays === 3 ? null : 3)}
                  label="Ingat 3 hari"
                />
                <Checkbox
                  checked={form.expiredDays === 30}
                  onChange={() => set('expiredDays', form.expiredDays === 30 ? null : 30)}
                  label="Ingat 30 hari"
                />
              </div>

              {/* ── Submit ── */}
              <button type="submit" className="lp-btn" disabled={loading}>
                {loading
                  ? <><span className="lp-spinner" /> Masuk...</>
                  : 'Log In'
                }
              </button>
            </form>

            {/* Footer */}
            <p style={{
              textAlign: 'center', fontSize: 11.5, color: '#9CA3AF',
              marginTop: '1.5rem', marginBottom: 0,
            }}>
              Belum punya akun?{' '}
              <span style={{ fontWeight: 600, color: '#18181b' }}>
                Hubungi departemen IT
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}