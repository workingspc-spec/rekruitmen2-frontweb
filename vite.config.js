import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Ketika frontend memanggil /api/auth
      // Vite akan meneruskannya ke http://localhost:3000/api/auth (UTUH)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') <-- DIHAPUS agar /api tetap ada
      }
    }
  }
})