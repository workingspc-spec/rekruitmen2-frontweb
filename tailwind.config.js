/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sapphire:    '#0F52BA',
        navy:        '#000926',
        'ice-blue':  '#D6E6F3',
        'powder-blue':'#A6C5D7',
        primary:     '#0F52BA',
        success:     '#2E7D32',
        warning:     '#F57C00',
        error:       '#D32F2F',
        info:        '#0F52BA',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card:       '0 2px 12px rgba(15,82,186,0.08)',
        'card-hover':'0 8px 24px rgba(15,82,186,0.16)',
        glass:      '0 4px 32px rgba(15,82,186,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'linear-gradient(135deg, #0F52BA 0%, #000926 100%)',
      },
      // ── Tambahan: custom easing untuk efek "pintu/jendela" ────────────────
      // ease-door: cubic-bezier(0.4, 0, 0.2, 1)
      //   = Material Design "standard curve"
      //   = Akselerasi cepat di awal → melambat smooth di akhir
      //   = Terasa seperti pintu yang didorong dan berhenti perlahan
      // ease-door-in: dipakai untuk animasi menutup (ease-in feel)
      transitionTimingFunction: {
        'door':    'cubic-bezier(0.4, 0, 0.2, 1)',
        'door-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      // ── Tambahan: duration-250 (antara 200 dan 300) ───────────────────────
      transitionDuration: {
        '250': '250ms',
      },
      animation: {
        'slide-up':     'slideUp 0.3s ease both',
        'fade-in':      'fadeIn 0.25s ease both',
        'bounce-soft':  'bounceSoft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'shimmer':      'shimmer 1.4s infinite',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        bounceSoft: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}