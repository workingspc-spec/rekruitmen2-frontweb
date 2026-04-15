import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * [FIX-KRITIS] Konfigurasi proxy diperbarui untuk mendukung httpOnly cookie auth.
 *
 * Sebelumnya: Browser mengirim Authorization header dengan token dari localStorage.
 * Sekarang: Browser mengirim httpOnly cookie secara otomatis (via withCredentials).
 *
 * Vite proxy meneruskan cookie ke backend secara transparan.
 * Browser mengira request ke '/api' adalah same-origin (localhost:5173),
 * sehingga cookie dikirim dan cookie response dari server di-set dengan benar.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:3000',
        changeOrigin: true,
        secure:       false,
        // Cookie dari backend (set-cookie header) diteruskan ke browser oleh Vite proxy
        // Tidak perlu konfigurasi tambahan — Vite menangani ini secara otomatis
        // selama `withCredentials: true` di-set di axios
      }
    }
  }
})