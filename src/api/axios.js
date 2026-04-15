import axios from 'axios'

/**
 * [FIX-KRITIS] Token JWT TIDAK lagi diambil dari localStorage.
 * Autentikasi web kini menggunakan httpOnly cookie yang di-set oleh server.
 *
 * - `withCredentials: true` memberitahu browser untuk menyertakan cookie
 *   secara otomatis di setiap request, tanpa JS perlu menyentuh token.
 * - httpOnly cookie tidak dapat diakses oleh JS → kebal XSS.
 *
 * Android/API client tetap menggunakan Bearer token melalui AuthInterceptor.kt
 * (tidak terdampak perubahan ini).
 */
const api = axios.create({
  baseURL:         '/api',
  timeout:         30_000,
  withCredentials: true, // [FIX-KRITIS] Kirim httpOnly cookie otomatis di setiap request
  headers: { 'Content-Type': 'application/json' },
})

// [HAPUS] Interceptor lama yang mengambil token dari localStorage:
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('token')
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })
// Token kini dikelola via httpOnly cookie — tidak perlu interceptor manual.

export default api