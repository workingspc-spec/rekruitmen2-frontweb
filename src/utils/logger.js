// src/utils/logger.js
const isDev = import.meta.env.DEV

const logger = {
  log:   (...args) => { if (isDev) console.log(...args) },
  info:  (...args) => { if (isDev) console.info(...args) },
  warn:  (...args) => { if (isDev) console.warn(...args) },
  error: (...args) => { if (isDev) console.error(...args) },

  captureException: (error, context = {}) => {
    if (isDev) {
      console.error('[Exception]', error, context)
      return
    }
    
    // ✅ PERBAIKAN: Kirim log ke backend VPS menggunakan Fetch API (Size: 0 KB)
    try {
      const payload = {
        source: 'react-web',
        message: error?.message || String(error),
        stack: error?.stack || null,
        context: context,
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // keepalive: true memastikan request tetap terkirim walau user langsung menutup tab/browser
      fetch('/api/logs/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true 
      }).catch(() => {
        // Abaikan jika gagal (misal server mati/koneksi putus), agar tidak muncul error ganda
      });
    } catch (e) {
      // Fail-safe
    }
  },
}

export default logger