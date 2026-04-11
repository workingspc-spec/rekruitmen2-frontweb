/**
 * ============================================================================
 * DOKUMEN KOMPONEN: LOGIN PAGE - SISTEM MANAJEMEN REKRUITMEN (PKAR)
 * ============================================================================
 * @version 3.0.0
 * Perubahan dari v2.1.0:
 *  - Layout 35/65 (kiri/kanan)
 *  - Panel kiri: flat, tidak melayang, tanpa diagonal, tanpa drop-shadow
 *  - Panel kanan: background abu-abu (#F2F3F5), float border pada form card
 *  - Logo besar di atas, judul & subtitle di bawah logo (left panel)
 *  - Form glass card mepet ke sisi kanan panel kanan (justify flex-end)
 *  - Canvas partikel hanya pada panel kanan (area abu-abu)
 *  - Checkbox dapat diklik via teks label maupun kotak
 * ============================================================================
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

// ─────────────────────────────────────────────
// KONFIGURASI SISTEM
// ─────────────────────────────────────────────
const SYSTEM_CONFIG = {
  storageKeys: { history: 'usernameHistory' },
  limits: { maxHistoryItems: 10 },
  colors: {
    sapphire: '#0F52BA',
    sapphireHover: '#0D459D',
    sapphireLight: 'rgba(15, 82, 186, 0.15)',
    error: '#E11D48',
    darkBg: '#ffffff',      // ← UBAH DI SINI: Background panel kiri jadi putih
    grayBg: '#ffffff',    // ← background panel kanan
    textMain: '#18181b',
    textMuted: '#9CA3AF',
    borderLight: '#D1D5DB',
    white: '#ffffff',
  },
  animation: {
    particleCount: 1200,
    mouseRadius: 450,
    mouseForce: 1.8,
  },
};

// ─────────────────────────────────────────────
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────
function loadUsernameHistory() {
  try {
    const raw = localStorage.getItem(SYSTEM_CONFIG.storageKeys.history);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveUsernameHistory(username) {
  if (!username?.trim()) return;
  try {
    const clean = username.trim();
    const prev = loadUsernameHistory().filter(u => u !== clean);
    const next = [clean, ...prev].slice(0, SYSTEM_CONFIG.limits.maxHistoryItems);
    localStorage.setItem(SYSTEM_CONFIG.storageKeys.history, JSON.stringify(next));
  } catch (e) { console.error('Gagal menyimpan riwayat username:', e); }
}

// ─────────────────────────────────────────────
// PARTICLE ENGINE (muncul di area abu-abu saja)
// ─────────────────────────────────────────────
class Particle {
  constructor(canvas, colors) {
    this.canvas = canvas;
    this.colors = colors;
    this.bx = Math.random() * canvas.width;
    this.by = Math.random() * canvas.height;
    this.x = this.bx; this.y = this.by;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.size = 0; this.targetSize = 0; this.angle = 0;
    this.speed = Math.random() * 0.04 + 0.015;
    this.offset = Math.random() * Math.PI * 2;
    this.friction = Math.random() * 0.05 + 0.08;
  }

  update(mouse) {
    const dx = mouse.x - this.bx;
    const dy = mouse.y - this.by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let tx = this.bx, ty = this.by;

    if (dist < SYSTEM_CONFIG.animation.mouseRadius) {
      const ratio = (SYSTEM_CONFIG.animation.mouseRadius - dist) / SYSTEM_CONFIG.animation.mouseRadius;
      const force = Math.pow(ratio, SYSTEM_CONFIG.animation.mouseForce);
      const pulse = Math.sin(Date.now() * this.speed + this.offset) * 0.5 + 0.5;
      this.targetSize = force * 5 * pulse + force * 2.5;
      const ang = Math.atan2(dy, dx);
      tx -= Math.cos(ang) * force * 20;
      ty -= Math.sin(ang) * force * 20;
      this.angle = ang;
    } else {
      this.targetSize = 0;
    }

    this.size += (this.targetSize - this.size) * 0.12;
    this.x += (tx - this.x) * this.friction;
    this.y += (ty - this.y) * this.friction;
  }

  draw(ctx) {
    if (this.size < 0.1) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 2.2, this.size / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.min(1, this.size / 3.5);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Hook: pasang partikel pada <canvas> yang ada di dalam rightPanelRef.
 * Mouse tracking menggunakan koordinat relatif terhadap panel kanan.
 */
function useRightPanelParticles(canvasRef, rightPanelRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const panel = rightPanelRef.current;
    if (!canvas || !panel) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let rafId;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const particleColors = ['#F9A826', '#E94A47', '#9B51E0', SYSTEM_CONFIG.colors.sapphire, '#34A853'];
    const particles = Array.from(
      { length: SYSTEM_CONFIG.animation.particleCount },
      () => new Particle(canvas, particleColors)
    );

    const cur = { x: -2000, y: -2000 };
    const tgt = { x: -2000, y: -2000 };

    // Track mouse relatif terhadap panel kanan
    const onMouseMove = (e) => {
      tgt.x = e.clientX;
      tgt.y = e.clientY;
    };
    const onMouseLeave = () => { tgt.x = -2000; tgt.y = -2000; };

    window.addEventListener('mousemove', onMouseMove);
    panel.addEventListener('mouseleave', onMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cur.x += (tgt.x - cur.x) * 0.12;
      cur.y += (tgt.y - cur.y) * 0.12;
      particles.forEach(p => { p.update(cur); p.draw(ctx); });
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      panel.removeEventListener('mousemove', onMouseMove);
      panel.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);
}

// ─────────────────────────────────────────────
// UI: APP LOGO
// ─────────────────────────────────────────────
function AppLogo({ size = 120 }) {
  const [valid, setValid] = useState(true);
  if (valid) {
    return (
      <img
        src="/logo_app.png"
        alt="Logo PKAR"
        onError={() => setValid(false)}
        style={{ width: size, height: 'auto', maxHeight: size, objectFit: 'contain' }}
      />
    );
  }
  // Fallback logo jika gambar gagal dimuat (Diubah ke tema biru)
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.22,
      background: SYSTEM_CONFIG.colors.sapphireLight,
      border: `1.5px solid ${SYSTEM_CONFIG.colors.sapphire}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: size * 0.45, fontWeight: 800, color: SYSTEM_CONFIG.colors.sapphire }}>P</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// UI: LEFT PANEL CONTENT
// Logo besar di atas → judul → subtitle
// ─────────────────────────────────────────────
function LeftPanelContent() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      textAlign: 'left',
      padding: '6rem 5rem',
    }}>
      {/* TITLE diperbesar & dipresisikan line-height nya */}
      <h1 style={{
        fontSize: 'clamp(64px, 6.5vw, 96px)', // Ukuran diperbesar
        fontWeight: 800,
        lineHeight: 1.02, // Dibuat lebih rapat/presisi
        letterSpacing: '-0.04em',
        color: SYSTEM_CONFIG.colors.textMain,
        margin: 0,
      }}>
        Rekruitmen<br />
        Permintaan<br />
        Karyawan
      </h1>

      <div style={{ height: '2.5rem' }} />

      {/* SUBTITLE diperbesar */}
      <p style={{
        color: SYSTEM_CONFIG.colors.textMuted,
        fontSize: 'clamp(20px, 1.8vw, 26px)', // Ukuran diperbesar
        lineHeight: 1.6,
        maxWidth: '580px', // Diperlebar menyesuaikan teks yang lebih besar
        margin: 0,
      }}>
        Pantau proses rekruitmen, SLA, approval,
        dan KPI dalam satu platform terpadu.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// UI: ANIMATED EYE TOGGLE v4.1
//
// ✅ Warna solid hitam (#18181b)
// ✅ 3 helai bulu mata atas & bawah, lebih panjang
// ✅ Kelopak tertutup lebih cekung (curve turun dalam)
// ─────────────────────────────────────────────────────────
function AnimatedEye({ isVisible, isError, isFocused, onToggle }) {
  const containerRef = useRef(null);
  const eyeballRef   = useRef(null);

  const movePupil = useCallback((e) => {
    if (!containerRef.current || !eyeballRef.current) return;
    if (!isVisible) {
      eyeballRef.current.style.transform = 'translate(0px, 0px)';
      return;
    }
    const rect  = containerRef.current.getBoundingClientRect();
    const cx    = rect.left + rect.width  / 2;
    const cy    = rect.top  + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const maxR  = isError ? 3.0 : 2.0;
    const dist  = Math.min(
      Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2) * 0.045,
      maxR
    );
    eyeballRef.current.style.transform =
      `translate(${(Math.cos(angle) * dist).toFixed(2)}px,` +
      `${(Math.sin(angle) * dist).toFixed(2)}px)`;
  }, [isVisible, isError]);

  useEffect(() => {
    window.addEventListener('mousemove', movePupil);
    return () => window.removeEventListener('mousemove', movePupil);
  }, [movePupil]);

  const color = '#18181b';

  const pupilR = isError ? 3.5  : 3.0;
  const catchR = isError ? 0.9  : 0.6;

  const P_NORMAL = 'M2,12 C6,5.5 18,5.5 22,12 C18,18.5 6,18.5 2,12 Z';
  const P_ERROR  = 'M2,12 C5,4   19,4   22,12 C19,20   5,20   2,12 Z';
  const P_CLOSED = 'M2,12 C6,18  18,18  22,12 C18,18   6,18   2,12 Z';

  const eyePath = !isVisible ? P_CLOSED : isError ? P_ERROR : P_NORMAL;
  const D_T = 'd 0.40s cubic-bezier(0.34, 1.56, 0.64, 1)';
  const R_T = 'r 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)';

  return (
    <button
      type="button"
      ref={containerRef}
      onClick={onToggle}
      aria-label={isVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      style={{
        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 6, outline: 'none',
      }}
    >
      <svg
        width="22" height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={{ overflow: 'visible' }}
      >
        {/* 1. SCLERA */}
        <path
          d={eyePath}
          fill="white"
          stroke="none"
          style={{ transition: D_T }}
        />

        {/* 2. BOLA MATA: iris ring luar · pupil · catchlight (tanpa fill & ring dalam) */}
        <g
          ref={eyeballRef}
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.22s ease, transform 0.055s linear',
            pointerEvents: 'none',
          }}
        >

          {/* Pupil hitam solid */}
          <circle cx="12" cy="12" r={pupilR}
            fill={color}
            style={{ transition: R_T }} />
          {/* Catchlight utama */}
          <circle cx="13.1" cy="10.7" r={catchR}
            fill="white"
            style={{ transition: R_T }} />
          {/* Catchlight sekunder kecil */}
          <circle cx="11.0" cy="13.2" r={catchR * 0.42}
            fill="white" opacity="0.55"
            style={{ transition: R_T }} />
        </g>

        {/* 3. OUTLINE KELOPAK MATA */}
        <path
          d={eyePath}
          stroke={color}
          strokeWidth={isError ? '1.7' : '1.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ transition: `${D_T}, stroke-width 0.2s` }}
        />

        {/* 4. BULU MATA — hanya muncul saat mata TERTUTUP (!isVisible) */}
        <g style={{
          opacity: !isVisible ? 1 : 0,
          transform: !isVisible ? 'translateY(0px)' : 'translateY(-3px)',
          transition: 'opacity 0.30s ease, transform 0.40s cubic-bezier(0.34,1.56,0.64,1)',
          pointerEvents: 'none',
        }}>
          {/* Kiri — miring ke kiri-bawah */}
          <path
            d="M7.5,15.6 Q6.7,18.6 6.0,20.8"
            stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none"
          />
          {/* Tengah — lurus ke bawah */}
          <path
            d="M12.0,16.5 Q12.0,19.5 12.1,22.0"
            stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none"
          />
          {/* Kanan — miring ke kanan-bawah */}
          <path
            d="M16.5,15.6 Q17.3,18.6 18.0,20.8"
            stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none"
          />
        </g>

      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────
// UI: FLOATING LABEL INPUT
// ─────────────────────────────────────────────
function FloatingInput({
  id, label, value, onChange,
  isError = false, isPassword = false,
  isVisible, onToggle,
  onFocus, onBlur,
  autoComplete, autoFocus,
  inputRef, onKeyDown,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = isFocused || value?.length > 0;
  const activeColor = isError
    ? SYSTEM_CONFIG.colors.error
    : isFocused
    ? SYSTEM_CONFIG.colors.sapphire
    : SYSTEM_CONFIG.colors.textMuted;

  return (
    <div style={{ position: 'relative', paddingTop: 18 }}>
      <label htmlFor={id} style={{
        position: 'absolute', left: 0,
        top: shouldFloat ? 0 : 26,
        fontSize: shouldFloat ? 11 : 15,
        fontWeight: shouldFloat ? 500 : 400,
        color: activeColor,
        transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'none',
        letterSpacing: shouldFloat ? '0.05em' : 0,
        userSelect: 'none',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          id={id}
          type={!isPassword ? 'text' : isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => { setIsFocused(true); onFocus?.(); }}
          onBlur={() => { setIsFocused(false); onBlur?.(); }}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          style={{
            width: '100%', border: 'none', outline: 'none',
            borderBottom: `${shouldFloat || isError ? 2 : 1}px solid ${activeColor}`,
            background: 'transparent', fontSize: 15, paddingBottom: 8,
            paddingRight: isPassword ? 34 : 0,
            color: SYSTEM_CONFIG.colors.textMain,
            fontFamily: 'inherit',
            letterSpacing: isPassword && !isVisible ? '0.12em' : 'normal',
            transition: 'border-color 0.18s', boxSizing: 'border-box',
          }}
        />
        {isPassword && (
          <AnimatedEye
            isVisible={isVisible} isError={isError}
            isFocused={isFocused} onToggle={onToggle}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UI: CHECKBOX
// FIX: onClick pada <label> terluar agar klik teks pun berfungsi
// ─────────────────────────────────────────────
function Checkbox({ checked, onChange, label }) {
  return (
    <label
      onClick={onChange}        /* ← klik teks ATAU kotak sama-sama trigger */
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        border: `${checked ? 2 : 1}px solid ${checked ? SYSTEM_CONFIG.colors.sapphire : SYSTEM_CONFIG.colors.borderLight}`,
        background: checked ? SYSTEM_CONFIG.colors.sapphire : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease-in-out',
        pointerEvents: 'none',   /* biarkan <label> yang handle klik */
      }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M2 6 5 9 10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
    </label>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', password: '', expiredDays: null });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const [savedUsernames, setSavedUsernames] = useState([]);
  const [isSuggestBoxOpen, setIsSuggestBoxOpen] = useState(false);

  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const suggestDropdownRef = useRef(null);
  const mainContainerRef = useRef(null);
  const particleCanvasRef = useRef(null); // ← canvas di dalam panel kanan

  // Partikel hanya di panel kanan
  useRightPanelParticles(particleCanvasRef, mainContainerRef);

  useEffect(() => {
    setSavedUsernames(loadUsernameHistory());
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const outUser = usernameInputRef.current && !usernameInputRef.current.contains(e.target);
      const outDrop = suggestDropdownRef.current && !suggestDropdownRef.current.contains(e.target);
      if (outUser && outDrop) setIsSuggestBoxOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateField = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const filteredUsernames = formData.username
    ? savedUsernames.filter(u => u.toLowerCase().includes(formData.username.toLowerCase()))
    : savedUsernames;

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 520);
  };

  const onUsernameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsSuggestBoxOpen(false);
      passwordInputRef.current?.focus();
    }
  };

  const onPasswordKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSuggestBoxOpen(false);
    if (!formData.username || !formData.password) {
      setErrorMessage('Username dan password wajib diisi.');
      triggerShake();
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(formData.username, formData.password, formData.expiredDays);
      saveUsernameHistory(formData.username);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login gagal. Periksa kembali data Anda.';
      setErrorMessage(msg);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── CSS IN-JS ─────────────────────────────
  const css = `
    *, *::before, *::after { box-sizing: border-box; }

    @keyframes shakeAnimation {
      0%, 100% { transform: translateX(0); }
      12% { transform: translateX(-9px); } 25% { transform: translateX(9px); }
      37% { transform: translateX(-6px); } 50% { transform: translateX(6px); }
      62% { transform: translateX(-3px); } 75% { transform: translateX(3px); }
    }
    @keyframes fadeSlideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInFromRight {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes spinLoader { to { transform: rotate(360deg); } }

    html, body, #root {
      height: 100%; margin: 0; padding: 0;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }

    /* WRAPPER HALAMAN: Pindahkan background putih full ke sini */
    .login-page-container {
      display: flex;
      min-height: 100vh;
      width: 100vw;
      background: #ffffff;  /* ← Background putih penuh di sini */
      position: relative;   /* ← Tambahkan ini agar canvas bisa full cover */
    }

    /* ── PANEL KIRI ── */
    .left-panel {
      display: none;
      width: 35%;
      height: 100vh;
      background: transparent; /* ← Jadikan transparan */
      position: relative;
      z-index: 10;             /* ← Samakan z-index */
      flex-shrink: 0;
    }
    @media (min-width: 900px) { .left-panel { display: flex; flex-direction: column; } }

    /* ── PANEL KANAN ── */
    .right-panel {
      width: 100%;
      height: 100vh;
      background: transparent; /* ← Jadikan transparan */
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 2.5rem 3rem 2.5rem 2rem;
      z-index: 10;             /* ← Samakan z-index */
    }
    @media (min-width: 900px) { .right-panel { width: 65%; } }

    /* ── FORM GLASS CARD ── */
    .form-glass-card {
      width: 100%;
      max-width: 420px;
      padding: 2.2rem 3rem;
      position: relative;
      z-index: 30;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 26px;
      border: 1px solid rgba(255,255,255,0.65);
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      animation: slideInFromRight 0.6s cubic-bezier(0.16,1,0.3,1);
    }

    .checkbox-layout-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 0.75rem; margin-bottom: 1.25rem; width: 100%;
    }

    .error-shake-effect { animation: shakeAnimation 0.52s cubic-bezier(.36,.07,.19,.97) both; }

    /* AUTOCOMPLETE DROPDOWN */
    .autocomplete-dropdown {
      animation: fadeSlideDown 0.16s ease-out;
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
      background: ${SYSTEM_CONFIG.colors.white};
      border: 1px solid ${SYSTEM_CONFIG.colors.borderLight};
      border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      overflow: hidden; max-height: 200px; overflow-y: auto;
    }
    .suggestion-item-btn {
      width: 100%; display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; background: none; border: none; cursor: pointer;
      text-align: left; font-family: inherit; font-size: 13px;
      color: ${SYSTEM_CONFIG.colors.textMain}; font-weight: 500;
      transition: background 0.1s ease;
    }
    .suggestion-item-btn:hover, .suggestion-item-btn:focus { background: #f9fafb; outline: none; }
    .dropdown-divider-line { height: 1px; background: #f3f4f6; margin: 0 16px; }

    /* TOMBOL SUBMIT */
    .submit-action-btn {
      width: 100%; height: 52px;
      background: ${SYSTEM_CONFIG.colors.sapphire};
      color: ${SYSTEM_CONFIG.colors.white};
      border: none; border-radius: 9999px;
      font-size: 15px; font-weight: 600; letter-spacing: 0.02em;
      cursor: pointer; font-family: inherit;
      transition: all 0.25s cubic-bezier(.4,0,.2,1);
      display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 4px 14px ${SYSTEM_CONFIG.colors.sapphireLight};
    }
    .submit-action-btn:hover:not(:disabled) {
      background: ${SYSTEM_CONFIG.colors.sapphireHover};
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(15,82,186,0.3);
    }
    .submit-action-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
    .submit-action-btn:disabled { opacity: 0.65; cursor: not-allowed; }

    .loading-spinner-ring {
      width: 18px; height: 18px; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: ${SYSTEM_CONFIG.colors.white};
      border-radius: 50%; animation: spinLoader 0.7s linear infinite; display: inline-block;
    }
  `;

return (
    <>
      <style>{css}</style>

      {/* 1. Pasang mainContainerRef di container paling luar */}
      <div className="login-page-container" ref={mainContainerRef}>

        {/* 2. Pindahkan Canvas ke sini agar menutupi seluruh layar (Full Screen) */}
        <canvas
          ref={particleCanvasRef}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            zIndex: 1, pointerEvents: 'none',
          }}
        />

        {/* ── PANEL KIRI ── */}
        <div className="left-panel">
          <LeftPanelContent />
        </div>

        {/* ── PANEL KANAN ── */}
        {/* 3. Hapus ref={rightPanelRef} dari sini karena sudah tidak dipakai */}
        <div className="right-panel">

          {/* Form Glass Card */}
          <div className="form-glass-card">

            {/* Brand icon */}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '0.5rem',    /* Menurunkan logo agar ada space aman dari border atas */
              marginBottom: '0.5rem'  /* Margin bawah diperkecil drastis untuk mengimbangi logo yang membesar */
            }}>
              <AppLogo size={135} />
            </div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: SYSTEM_CONFIG.colors.sapphire, letterSpacing: '-0.02em' }}>
                Welcome back !
              </h2>
              <p style={{ fontSize: 13, color: SYSTEM_CONFIG.colors.textMuted, margin: 0 }}>
                Please enter your details
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="off" noValidate>

              {/* Username + autocomplete */}
              <div style={{ marginBottom: '0.75rem', position: 'relative' }} ref={usernameInputRef}>
                <FloatingInput
                  id="usernameInput"
                  label="Username"
                  value={formData.username}
                  onChange={(e) => { updateField('username', e.target.value); setIsSuggestBoxOpen(true); }}
                  onFocus={() => { if (savedUsernames.length > 0) setIsSuggestBoxOpen(true); }}
                  onBlur={() => setTimeout(() => setIsSuggestBoxOpen(false), 200)}
                  onKeyDown={onUsernameKeyDown}
                  isError={!!errorMessage}
                  autoComplete="off"
                  autoFocus
                />
                {isSuggestBoxOpen && filteredUsernames.length > 0 && (
                  <div className="autocomplete-dropdown" ref={suggestDropdownRef}>
                    {filteredUsernames.map((u, i) => (
                      <div key={`${u}-${i}`}>
                        <button
                          type="button"
                          className="suggestion-item-btn"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            updateField('username', u);
                            setIsSuggestBoxOpen(false);
                            setTimeout(() => passwordInputRef.current?.focus(), 50);
                          }}
                        >
                          <User size={14} style={{ color: SYSTEM_CONFIG.colors.textMuted, flexShrink: 0 }} />
                          {u}
                        </button>
                        {i < filteredUsernames.length - 1 && <div className="dropdown-divider-line" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className={isShaking ? 'error-shake-effect' : ''} style={{ marginBottom: '1.25rem' }}>
                <FloatingInput
                  id="passwordInput"
                  label="Password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  onKeyDown={onPasswordKeyDown}
                  isError={!!errorMessage}
                  isPassword
                  isVisible={showPassword}
                  onToggle={() => setShowPassword(p => !p)}
                  autoComplete="current-password"
                  inputRef={passwordInputRef}
                />
              </div>

              {/* Error message */}
              {errorMessage && (
                <div
                  className={isShaking ? 'error-shake-effect' : ''}
                  style={{
                    fontSize: 13, color: SYSTEM_CONFIG.colors.error, fontWeight: 600,
                    marginTop: '0.5rem', marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errorMessage}
                </div>
              )}

              {/* Checkboxes */}
              <div className="checkbox-layout-row">
                <Checkbox
                  checked={formData.expiredDays === 3}
                  onChange={() => updateField('expiredDays', formData.expiredDays === 3 ? null : 3)}
                  label="Ingat 3 hari"
                />
                <Checkbox
                  checked={formData.expiredDays === 30}
                  onChange={() => updateField('expiredDays', formData.expiredDays === 30 ? null : 30)}
                  label="Ingat 30 hari"
                />
              </div>

              {/* Submit */}
              <div style={{ width: '100%' }}>
                <button type="submit" className="submit-action-btn" disabled={isLoading}>
                  {isLoading
                    ? <><span className="loading-spinner-ring" /> Memproses...</>
                    : 'Log In'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div style={{
              textAlign: 'center', marginTop: '1.25rem',
              borderTop: `1px solid ${SYSTEM_CONFIG.colors.borderLight}60`,
              paddingTop: '1rem',
            }}>
              <p style={{ fontSize: 13, color: SYSTEM_CONFIG.colors.textMuted, margin: 0 }}>
                Belum punya akun?{' '}
                <span
                  style={{ fontWeight: 600, color: SYSTEM_CONFIG.colors.sapphire, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseOver={e => e.target.style.color = SYSTEM_CONFIG.colors.sapphireHover}
                  onMouseOut={e => e.target.style.color = SYSTEM_CONFIG.colors.sapphire}
                >
                  Hubungi departemen IT
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}