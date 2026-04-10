/**
 * ============================================================================
 * DOKUMEN KOMPONEN: LOGIN PAGE - SISTEM MANAJEMEN REKRUITMEN (PKAR)
 * ============================================================================
 * * Deskripsi:
 * Komponen ini menangani antarmuka masuk (login) untuk platform PKAR.
 * Desain menggunakan konsep "Floating Split Screen".
 * Panel kiri memiliki background gelap yang melayang dengan sudut membulat
 * (rounded) dan potongan miring (diagonal) yang tegas.
 * * Animasi:
 * Dilengkapi dengan "Antigravity Particle Engine" (1500 partikel) di 
 * latar belakang area putih yang bereaksi terhadap pergerakan kursor pengguna.
 * * Tema Warna:
 * Menggunakan aksen Sapphire (#0F52BA).
 * * @version 2.1.0
 * @author PKAR UI/UX Engineering Team
 * ============================================================================
 */

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback 
} from 'react';
import { 
  useNavigate 
} from 'react-router-dom';
import { 
  useAuth 
} from '../context/AuthContext';
import { 
  User 
} from 'lucide-react';

/**
 * ----------------------------------------------------------------------------
 * KONFIGURASI SISTEM
 * ----------------------------------------------------------------------------
 */
const SYSTEM_CONFIG = {
  storageKeys: {
    history: 'usernameHistory',
  },
  limits: {
    maxHistoryItems: 10,
  },
  colors: {
    sapphire: '#0F52BA',
    sapphireHover: '#0D459D',
    sapphireLight: 'rgba(15, 82, 186, 0.15)',
    error: '#E11D48',
    darkBg: '#363435',
    textMain: '#18181b',
    textMuted: '#9CA3AF',
    borderLight: '#D1D5DB',
    white: '#ffffff',
  },
  animation: {
    particleCount: 1500, // Jumlah partikel yang padat untuk kesan ramai
    mouseRadius: 250,
    mouseForce: 1.8,
  }
};

/**
 * ----------------------------------------------------------------------------
 * HELPER: LOCAL STORAGE MANAGEMENT
 * ----------------------------------------------------------------------------
 */
function loadUsernameHistory() {
  try {
    const storedData = localStorage.getItem(SYSTEM_CONFIG.storageKeys.history);
    if (!storedData) {
      return [];
    }
    const parsedData = JSON.parse(storedData);
    if (Array.isArray(parsedData)) {
      return parsedData;
    }
    return [];
  } catch (error) {
    console.error('Gagal memuat riwayat username:', error);
    return [];
  }
}

function saveUsernameHistory(username) {
  if (!username || typeof username !== 'string') {
    return;
  }
  
  const cleanUsername = username.trim();
  if (cleanUsername.length === 0) {
    return;
  }

  try {
    const currentHistory = loadUsernameHistory();
    const filteredHistory = currentHistory.filter(
      (item) => item !== cleanUsername
    );
    
    const newHistory = [cleanUsername, ...filteredHistory];
    const slicedHistory = newHistory.slice(
      0, 
      SYSTEM_CONFIG.limits.maxHistoryItems
    );
    
    localStorage.setItem(
      SYSTEM_CONFIG.storageKeys.history, 
      JSON.stringify(slicedHistory)
    );
  } catch (error) {
    console.error('Gagal menyimpan riwayat username:', error);
  }
}

/**
 * ----------------------------------------------------------------------------
 * CLASS PHYSICS: ANTIGRAVITY PARTICLE ENGINE
 * ----------------------------------------------------------------------------
 */
class Particle {
  constructor(canvas, colors) {
    this.canvas = canvas;
    this.colors = colors;
    
    this.baseX = Math.random() * this.canvas.width;
    this.baseY = Math.random() * this.canvas.height;
    
    this.x = this.baseX;
    this.y = this.baseY;
    
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.size = 0;
    this.targetSize = 0;
    this.angle = 0;
    
    this.speed = Math.random() * 0.04 + 0.015;
    this.offset = Math.random() * Math.PI * 2;
    this.friction = Math.random() * 0.05 + 0.08;
  }

  update(mouse) {
    const dx = mouse.x - this.baseX;
    const dy = mouse.y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let targetX = this.baseX;
    let targetY = this.baseY;

    if (distance < SYSTEM_CONFIG.animation.mouseRadius) {
      const forceRatio = (SYSTEM_CONFIG.animation.mouseRadius - distance) / 
                          SYSTEM_CONFIG.animation.mouseRadius;
      const force = Math.pow(forceRatio, SYSTEM_CONFIG.animation.mouseForce);
      
      const timePulse = Math.sin(Date.now() * this.speed + this.offset);
      const normalizedPulse = timePulse * 0.5 + 0.5;
      
      this.targetSize = force * 5 * normalizedPulse + (force * 2.5);
      
      const angleToMouse = Math.atan2(dy, dx);
      const pushDistance = force * 20;
      
      targetX -= Math.cos(angleToMouse) * pushDistance;
      targetY -= Math.sin(angleToMouse) * pushDistance;
      this.angle = angleToMouse;
      
    } else {
      this.targetSize = 0;
    }

    this.size += (this.targetSize - this.size) * 0.12;
    this.x += (targetX - this.x) * this.friction;
    this.y += (targetY - this.y) * this.friction;
  }

  draw(ctx) {
    if (this.size < 0.1) {
      return; 
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.beginPath();
    const stretchFactor = this.size * 2.2;
    const thickness = this.size / 2;
    
    ctx.ellipse(0, 0, stretchFactor, thickness, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    
    const opacity = Math.min(1, Math.max(0, this.size / 3.5));
    ctx.globalAlpha = opacity;
    
    ctx.fill();
    ctx.restore();
  }
}

/**
 * ----------------------------------------------------------------------------
 * CUSTOM HOOK: USE ANTIGRAVITY ANIMATION
 * ----------------------------------------------------------------------------
 */
function useAntigravityAnimation(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    const particleColors = [
      '#F9A826', 
      '#E94A47', 
      '#9B51E0', 
      SYSTEM_CONFIG.colors.sapphire, 
      '#34A853'
    ];
    
    const particlesArray = [];
    
    for (let i = 0; i < SYSTEM_CONFIG.animation.particleCount; i++) {
      const newParticle = new Particle(canvas, particleColors);
      particlesArray.push(newParticle);
    }

    const currentMouse = { x: -2000, y: -2000 };
    const targetMouse = { x: -2000, y: -2000 };

    const onMouseMove = (event) => {
      targetMouse.x = event.clientX;
      targetMouse.y = event.clientY;
    };
    
    const onMouseLeave = () => {
      targetMouse.x = -2000;
      targetMouse.y = -2000;
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.15;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.15;

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update(currentMouse);
        particlesArray[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
}

/**
 * ----------------------------------------------------------------------------
 * UI COMPONENT: APP LOGO
 * ----------------------------------------------------------------------------
 */
function AppLogo({ size = 180 }) {
  const [isImageValid, setIsImageValid] = useState(true);
  
  const handleImageError = () => {
    setIsImageValid(false);
  };

  if (isImageValid) {
    return (
      <img
        src="/logo_app.png" 
        alt="Logo PKAR" 
        onError={handleImageError}
        style={{ 
          width: size, 
          height: 'auto', 
          maxHeight: size, 
          objectFit: 'contain',
          filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))' 
        }}
      />
    );
  }

  return (
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: size * 0.25,
      background: 'rgba(255,255,255,0.12)', 
      border: '1px solid rgba(255,255,255,0.22)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <span style={{ 
        fontSize: size * 0.4, 
        fontWeight: 800, 
        color: SYSTEM_CONFIG.colors.white 
      }}>
        P
      </span>
    </div>
  );
}

/**
 * ----------------------------------------------------------------------------
 * UI COMPONENT: ANIMATED EYE TOGGLE
 * ----------------------------------------------------------------------------
 */
function AnimatedEye({ 
  isVisible, 
  isError, 
  isFocused, 
  onToggle 
}) {
  const eyeContainerRef = useRef(null);
  const pupilRef = useRef(null);

  const calculatePupilMovement = useCallback((e) => {
    if (!eyeContainerRef.current || !pupilRef.current) {
      return;
    }
    
    const rect = eyeContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    const angle = Math.atan2(deltaY, deltaX);
    const maxDistance = 2.8;
    const distance = Math.min(
      Math.sqrt(deltaX * deltaX + deltaY * deltaY), 
      maxDistance
    );
    
    const translateX = (Math.cos(angle) * distance).toFixed(2);
    const translateY = (Math.sin(angle) * distance).toFixed(2);
    
    pupilRef.current.style.transform = `translate(${translateX}px, ${translateY}px)`;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', calculatePupilMovement);
    return () => {
      window.removeEventListener('mousemove', calculatePupilMovement);
    };
  }, [calculatePupilMovement]);

  let strokeColor = SYSTEM_CONFIG.colors.textMuted;
  if (isError) {
    strokeColor = SYSTEM_CONFIG.colors.error;
  } else if (isFocused) {
    strokeColor = SYSTEM_CONFIG.colors.sapphire;
  }

  const buttonStyle = {
    position: 'absolute', 
    right: 0, 
    top: '50%', 
    transform: 'translateY(-50%)',
    background: 'none', 
    border: 'none', 
    cursor: 'pointer',
    padding: 4, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    width: 28, 
    height: 28, 
    borderRadius: 6,
    outline: 'none'
  };

  return (
    <button 
      type="button" 
      ref={eyeContainerRef} 
      onClick={onToggle}
      aria-label={isVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      style={buttonStyle}
    >
      {isVisible ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible' }}>
          <path d="M2 12s5-7 10-7 10 7 10 7-5 7-10 7S2 12 2 12Z" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="12" r="3.2" stroke={strokeColor} strokeWidth="1.5" fill="none" />
          <circle ref={pupilRef} cx="12" cy="12" r="1.4" fill={strokeColor} style={{ transition: 'transform 0.05s linear', transformOrigin: '12px 12px' }} />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path d="M4 10s3.5 6 8 6 8-6 8-6" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 16v2.5M7.5 14.5 6 17M16.5 14.5 18 17" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

/**
 * ----------------------------------------------------------------------------
 * UI COMPONENT: FLOATING LABEL INPUT
 * ----------------------------------------------------------------------------
 */
function FloatingInput({
  id, 
  label, 
  value, 
  onChange, 
  isError = false,
  isPassword = false, 
  isVisible, 
  onToggle,
  onFocus, 
  onBlur, 
  autoComplete, 
  autoFocus,
  inputRef, 
  onKeyDown,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = isFocused || (value && value.length > 0);

  let activeColor = SYSTEM_CONFIG.colors.textMuted;
  if (isError) {
    activeColor = SYSTEM_CONFIG.colors.error;
  } else if (isFocused) {
    activeColor = SYSTEM_CONFIG.colors.sapphire;
  }

  const containerStyle = { position: 'relative', paddingTop: 18 };

  const labelStyle = {
    position: 'absolute', 
    left: 0,
    top: shouldFloat ? 0 : 26,
    fontSize: shouldFloat ? 11 : 15,
    fontWeight: shouldFloat ? 500 : 400,
    color: activeColor,
    transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
    pointerEvents: 'none',
    letterSpacing: shouldFloat ? '0.05em' : 0,
    userSelect: 'none'
  };

  const inputStyle = {
    width: '100%', 
    border: 'none', 
    outline: 'none',
    borderBottom: `${shouldFloat || isError ? 2 : 1}px solid ${activeColor}`,
    background: 'transparent', 
    fontSize: 15, 
    paddingBottom: 8,
    paddingRight: isPassword ? 34 : 0, 
    color: SYSTEM_CONFIG.colors.textMain, 
    fontFamily: 'inherit',
    letterSpacing: isPassword && !isVisible ? '0.12em' : 'normal',
    transition: 'border-color 0.18s', 
    boxSizing: 'border-box',
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  const determineInputType = () => {
    if (!isPassword) return 'text';
    return isVisible ? 'text' : 'password';
  };

  return (
    <div style={containerStyle}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef} id={id} type={determineInputType()}
          value={value} onChange={onChange} onKeyDown={onKeyDown}
          onFocus={handleInputFocus} onBlur={handleInputBlur}
          autoComplete={autoComplete} autoFocus={autoFocus}
          style={inputStyle}
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

/**
 * ----------------------------------------------------------------------------
 * UI COMPONENT: CUSTOM CHECKBOX
 * ----------------------------------------------------------------------------
 */
function Checkbox({ checked, onChange, label }) {
  const containerStyle = { display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' };

  const boxStyle = {
    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
    border: `${checked ? 2 : 1}px solid ${checked ? SYSTEM_CONFIG.colors.sapphire : SYSTEM_CONFIG.colors.borderLight}`,
    background: checked ? SYSTEM_CONFIG.colors.sapphire : 'transparent', 
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s ease-in-out',
  };

  return (
    <label style={containerStyle}>
      <div onClick={onChange} style={boxStyle} role="checkbox" aria-checked={checked}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M2 6 5 9 10 3" stroke={SYSTEM_CONFIG.colors.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
    </label>
  );
}

/**
 * ----------------------------------------------------------------------------
 * UI COMPONENT: LEFT PANEL CONTENT
 * ----------------------------------------------------------------------------
 * Area Tipografi dan Logo pada Panel Gelap Kiri.
 */
function LeftPanelContent() {
  const containerStyle = {
    width: '100%', 
    height: '100%', 
    position: 'relative', 
    zIndex: 10,
  };

  const titleStyle = {
    fontSize: 'clamp(32px, 3.8vw, 48px)', 
    fontWeight: 800,
    lineHeight: 1.1, 
    margin: '0 0 1.25rem', 
    letterSpacing: '-0.02em',
    color: SYSTEM_CONFIG.colors.white,
  };

  const subtitleStyle = {
    color: 'rgba(255,255,255,0.75)', 
    fontSize: 'clamp(14px, 1.2vw, 16px)',
    lineHeight: 1.6, 
    margin: '0',
  };

  return (
    <div style={containerStyle}>
      {/* Teks Mepet Kiri Atas */}
      <div style={{ 
        position: 'absolute', 
        top: '4rem', 
        left: '3.5rem', 
        maxWidth: '65%', // Menjaga agar teks tidak menabrak logo di kanan
        zIndex: 2 
      }}> 
        <h1 style={titleStyle}>
          REKRUITMEN<br />PERMINTAAN KARYAWAN
        </h1>
        <p style={subtitleStyle}>
          Pantau proses rekruitmen, SLA, approval, dan KPI dalam satu platform terpadu.
        </p>
      </div>

      {/* Logo Mepet Kanan Atas */}
      <div style={{ 
        position: 'absolute', 
        top: '4rem', 
        right: '18%', // Posisi aman disesuaikan dengan potongan miring polygon
        zIndex: 10 
      }}>
        <AppLogo size={85} />
      </div>
    </div>
  );
}

/**
 * ----------------------------------------------------------------------------
 * MAIN COMPONENT: LOGIN PAGE
 * ----------------------------------------------------------------------------
 */
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
  const globalCanvasRef = useRef(null);

  useAntigravityAnimation(globalCanvasRef);

  useEffect(() => {
    const history = loadUsernameHistory();
    setSavedUsernames(history);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const isOutsideUsername = usernameInputRef.current && !usernameInputRef.current.contains(event.target);
      const isOutsideDropdown = suggestDropdownRef.current && !suggestDropdownRef.current.contains(event.target);
                               
      if (isOutsideUsername && isOutsideDropdown) {
        setIsSuggestBoxOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const updateFormField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const filteredUsernames = formData.username
    ? savedUsernames.filter((u) => u.toLowerCase().includes(formData.username.toLowerCase()))
    : savedUsernames;

  const triggerShakeAnimation = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 520);
  };

  const onUsernameKeyDown = (e) => {
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      setIsSuggestBoxOpen(false); 
      if (passwordInputRef.current) passwordInputRef.current.focus();
    }
  };

  const onPasswordKeyDown = (e) => {
    if (e.key === 'Enter') { 
      e.preventDefault(); handleFormSubmit(e); 
    }
  };

  const handleFormSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSuggestBoxOpen(false);
    
    if (!formData.username || !formData.password) {
      setErrorMessage('Username dan password wajib diisi.'); 
      triggerShakeAnimation(); 
      return;
    }
    
    setErrorMessage(''); setIsLoading(true);
    
    try {
      await login(formData.username, formData.password, formData.expiredDays);
      saveUsernameHistory(formData.username);
      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login gagal. Periksa kembali data Anda.';
      setErrorMessage(msg);
      triggerShakeAnimation();
    } finally { 
      setIsLoading(false); 
    }
  };

  /**
   * --------------------------------------------------------------------------
   * BLOK CSS IN-JS INJECTION
   * --------------------------------------------------------------------------
   */
  const cssStyles = `
    *, *::before, *::after { box-sizing: border-box; }

    @keyframes shakeAnimation {
      0%, 100% { transform: translateX(0); }
      12% { transform: translateX(-9px); } 25% { transform: translateX(9px); }
      37% { transform: translateX(-6px); } 50% { transform: translateX(6px); }
      62% { transform: translateX(-3px); } 75% { transform: translateX(3px); }
    }

    @keyframes fadeSlideDown {
      from { opacity: 0; transform: translateY(-6px); } 
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideInFromRight {
      from { opacity: 0; transform: translateX(40px); } 
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes spinLoader { to { transform: rotate(360deg); } }

    html, body, #root { 
      height: 100%; margin: 0; padding: 0; 
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }

    .login-page-container {
      display: flex;
      min-height: 100vh;
      width: 100vw;
      background-color: ${SYSTEM_CONFIG.colors.white}; 
      position: relative;
    }

    /* * PANEL KIRI MELAYANG (FLOATING)
     * Menggunakan padding agar tidak menempel layar, dan filter shadow untuk menegaskan bentuk
     */
    .left-split-wrapper {
      display: none;
      width: 38%; /* Sedikit diperlebar menyesuaikan area floating */
      height: 100vh;
      position: relative;
      z-index: 20;
      padding: 2.5rem; /* Space margin luar agar terlihat melayang */
      /* Drop-shadow ini akan mengikuti bentuk polygon secara sempurna */
      filter: drop-shadow(15px 20px 40px rgba(0,0,0,0.22)); 
    }
    
    @media (min-width: 900px) { .left-split-wrapper { display: block; } }

    /* * PEMBENTUKAN POTONGAN MIRING DAN SUDUT HALUS
     */
    .diagonal-cut-shape {
      width: 100%;
      height: 100%;
      background-color: ${SYSTEM_CONFIG.colors.darkBg};
      border-radius: 32px; /* Membuat setiap sudut yang tidak terpotong menjadi halus/melengkung */
      clip-path: polygon(0% 0%, 100% 0%, 82% 100%, 0% 100%);
      transform: translateZ(0); /* Anti-aliasing hardware acceleration */
      backface-visibility: hidden;
      position: relative;
      overflow: hidden;
    }

    /* PANEL KANAN DAN SPACING FORM */
    .right-split-wrapper {
      width: 100%;
      height: 100vh;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Padding memberikan 'space' atas bawah agar animasi selalu bisa lewat tanpa terpotong form */
      padding: 3rem; 
      background: transparent;
      z-index: 10;
    }
    
    @media (min-width: 900px) { .right-split-wrapper { width: 62%; } }

    /* CONTAINER FORM LOGIN */
    .form-glass-card { 
      width: 100%; 
      max-width: 420px; 
      padding: 3rem;
      position: relative;
      z-index: 30;
      background: rgba(255, 255, 255, 0.90);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 28px;
      border: 1px solid rgba(255,255,255,0.6);
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      animation: slideInFromRight 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .checkbox-layout-row {
      display: flex; align-items: center; justify-content: space-between; 
      margin-top: 1.5rem; margin-bottom: 2.5rem; width: 100%;
    }

    .error-shake-effect { animation: shakeAnimation 0.52s cubic-bezier(.36,.07,.19,.97) both; }

    /* SUGGESTION DROPDOWN */
    .autocomplete-dropdown {
      animation: fadeSlideDown 0.16s ease-out;
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
      background: ${SYSTEM_CONFIG.colors.white}; border: 1px solid ${SYSTEM_CONFIG.colors.borderLight}; 
      border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      overflow: hidden; max-height: 200px; overflow-y: auto;
    }

    .suggestion-item-btn {
      width: 100%; display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; background: none; border: none; cursor: pointer;
      text-align: left; font-family: inherit; font-size: 13px;
      color: ${SYSTEM_CONFIG.colors.textMain}; font-weight: 500; transition: background 0.1s ease;
    }
    
    .suggestion-item-btn:hover, .suggestion-item-btn:focus { background: #f9fafb; outline: none; }
    .dropdown-divider-line { height: 1px; background: #f3f4f6; margin: 0 16px; }

    /* TOMBOL SUBMIT SAPPHIRE */
    .submit-action-btn {
      width: 100%; height: 52px; background: ${SYSTEM_CONFIG.colors.sapphire}; color: ${SYSTEM_CONFIG.colors.white};
      border: none; border-radius: 9999px; font-size: 15px; font-weight: 600;
      letter-spacing: 0.02em; cursor: pointer; font-family: inherit;
      transition: all 0.25s cubic-bezier(.4,0,.2,1); display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 4px 14px ${SYSTEM_CONFIG.colors.sapphireLight};
    }
    
    .submit-action-btn:hover:not(:disabled) {
      background: ${SYSTEM_CONFIG.colors.sapphireHover}; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15, 82, 186, 0.3);
    }
    .submit-action-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
    .submit-action-btn:disabled { opacity: 0.65; cursor: not-allowed; }

    .loading-spinner-ring {
      width: 18px; height: 18px; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.3); 
      border-top-color: ${SYSTEM_CONFIG.colors.white}; border-radius: 50%; 
      animation: spinLoader 0.7s linear infinite; display: inline-block;
    }
  `;

  return (
    <>
      <style>{cssStyles}</style>

      <div className="login-page-container">
        
        {/* 1. KANVAS ANIMASI PARTIKEL */}
        <canvas 
          ref={globalCanvasRef} 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 5, pointerEvents: 'none' 
          }} 
        />

        {/* 2. PANEL KIRI (MELAYANG DENGAN SUDUT HALUS) */}
        <div className="left-split-wrapper">
          <div className="diagonal-cut-shape">
            <LeftPanelContent />
          </div>
        </div>

        {/* 3. PANEL KANAN & FORM GLASS CARD */}
        <div className="right-split-wrapper">
          <div className="form-glass-card">
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill={SYSTEM_CONFIG.colors.sapphire}>
                <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.5 12 2Z" fill={SYSTEM_CONFIG.colors.sapphire} />
              </svg>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: SYSTEM_CONFIG.colors.sapphire, letterSpacing: '-0.02em' }}>
                Welcome back !
              </h2>
              <p style={{ fontSize: 14, color: SYSTEM_CONFIG.colors.textMuted, margin: 0 }}>
                Please enter your details
              </p>
            </div>

            <form onSubmit={handleFormSubmit} autoComplete="off" noValidate>
              
              <div style={{ marginBottom: '1.75rem', position: 'relative' }} ref={usernameInputRef}>
                <FloatingInput
                  id="usernameInput" label="Username" value={formData.username}
                  onChange={(e) => { updateFormField('username', e.target.value); setIsSuggestBoxOpen(true); }}
                  onFocus={() => { if (savedUsernames.length > 0) setIsSuggestBoxOpen(true); }}
                  onBlur={() => setTimeout(() => setIsSuggestBoxOpen(false), 200)}
                  onKeyDown={onUsernameKeyDown} isError={!!errorMessage} autoComplete="off" autoFocus
                />
                
                {isSuggestBoxOpen && filteredUsernames.length > 0 && (
                  <div className="autocomplete-dropdown" ref={suggestDropdownRef}>
                    {filteredUsernames.map((u, index) => (
                      <div key={`history-${u}-${index}`}>
                        <button type="button" className="suggestion-item-btn"
                          onMouseDown={(e) => {
                            e.preventDefault(); updateFormField('username', u); setIsSuggestBoxOpen(false);
                            setTimeout(() => { if (passwordInputRef.current) passwordInputRef.current.focus(); }, 50);
                          }}>
                          <User size={14} style={{ color: SYSTEM_CONFIG.colors.textMuted, flexShrink: 0 }} /> {u}
                        </button>
                        {index < filteredUsernames.length - 1 && <div className="dropdown-divider-line" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={isShaking ? 'error-shake-effect' : ''} style={{ marginBottom: '1.25rem' }}>
                <FloatingInput
                  id="passwordInput" label="Password" value={formData.password}
                  onChange={(e) => updateFormField('password', e.target.value)}
                  onKeyDown={onPasswordKeyDown} isError={!!errorMessage}
                  isPassword={true} isVisible={showPassword} onToggle={() => setShowPassword((prev) => !prev)}
                  autoComplete="current-password" inputRef={passwordInputRef}
                />
              </div>

              {errorMessage && (
                <div className={isShaking ? 'error-shake-effect' : ''} style={{
                    fontSize: 13, color: SYSTEM_CONFIG.colors.error, fontWeight: 600,
                    marginTop: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6
                  }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errorMessage}
                </div>
              )}

              <div className="checkbox-layout-row">
                <Checkbox checked={formData.expiredDays === 3}
                  onChange={() => updateFormField('expiredDays', formData.expiredDays === 3 ? null : 3)}
                  label="Ingat 3 hari" />
                <Checkbox checked={formData.expiredDays === 30}
                  onChange={() => updateFormField('expiredDays', formData.expiredDays === 30 ? null : 30)}
                  label="Ingat 30 hari" />
              </div>

              <div style={{ width: '100%' }}>
                <button type="submit" className="submit-action-btn" disabled={isLoading}>
                  {isLoading ? <><span className="loading-spinner-ring" /> Memproses...</> : 'Log In'}
                </button>
              </div>
            </form>

            <div style={{ textAlign: 'center', marginTop: '3rem', borderTop: `1px solid ${SYSTEM_CONFIG.colors.borderLight}50`, paddingTop: '1.5rem' }}>
              <p style={{ fontSize: 13, color: SYSTEM_CONFIG.colors.textMuted, margin: 0 }}>
                Belum punya akun?{' '}
                <span style={{ fontWeight: 600, color: SYSTEM_CONFIG.colors.sapphire, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.target.style.color = SYSTEM_CONFIG.colors.sapphireHover}
                  onMouseOut={(e) => e.target.style.color = SYSTEM_CONFIG.colors.sapphire}>
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