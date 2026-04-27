/**
 * security.js — Utilitas keamanan terpusat
 *
 * Berisi:
 *  - sanitizeApiError()        → filter pesan error API sebelum ditampilkan ke user
 *  - saveUsernameToHistory()   → simpan username dengan obfuskasi ke localStorage
 *  - loadUsernameHistory()     → baca daftar username yang tersimpan
 *  - clearUsernameHistory()    → hapus riwayat username
 *  - saveUserToStorage()       → simpan data user minimal ke sessionStorage
 *  - loadUserFromStorage()     → baca data user dari sessionStorage
 *  - clearUserFromStorage()    → hapus data user dari storage
 */

// ── API Error Sanitizer ───────────────────────────────────────────────────────
// Pola yang mengindikasikan error internal server — tidak boleh ditampilkan ke user
const INTERNAL_ERROR_PATTERNS = [
  /sql/i,
  /syntax error/i,
  /column ['"`]?.+['"`]? doesn't exist/i,
  /table ['"`]?.+['"`]? doesn't exist/i,
  /connection refused/i,
  /ECONNREFUSED/,
  /stack trace/i,
  /at Object\./,
  /\.js:\d+:\d+/,
  /Cannot read propert/i,
  /undefined is not/i,
]

/**
 * Filter pesan error API agar tidak bocorkan info internal ke user.
 *
 * @param {unknown} axiosError  - Error dari axios catch block
 * @param {string}  fallback    - Pesan default yang ditampilkan ke user
 * @returns {string}
 */
export function sanitizeApiError(
  axiosError,
  fallback = 'Terjadi kesalahan. Silakan coba lagi.'
) {
  const raw = axiosError?.response?.data?.message ?? ''

  if (!raw || typeof raw !== 'string') return fallback

  // Pesan terlalu panjang → kemungkinan dump internal
  if (raw.length > 200) return fallback

  // Mengandung pola error internal → jangan tampilkan
  const isInternal = INTERNAL_ERROR_PATTERNS.some(pattern => pattern.test(raw))
  if (isInternal) return fallback

  return raw
}

// ── Username History ──────────────────────────────────────────────────────────
// Obfuskasi sederhana agar username tidak terbaca plain text di localStorage.
// Tujuan: menurunkan risiko script oportunistik membaca daftar akun valid.
// Bukan enkripsi kriptografis — attacker targeted tetap bisa reverse.

const _UH_KEY   = '_pkar_uh'  // Key tidak deskriptif
const _UH_SHIFT = 13           // ROT13-like shift

function _encodeUsername(str) {
  try {
    return btoa(
      encodeURIComponent(str)
        .split('')
        .map(c => String.fromCharCode(c.charCodeAt(0) + _UH_SHIFT))
        .join('')
    )
  } catch {
    return null
  }
}

function _decodeUsername(str) {
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map(c => String.fromCharCode(c.charCodeAt(0) - _UH_SHIFT))
        .join('')
    )
  } catch {
    return null
  }
}

/**
 * Simpan username ke riwayat dengan obfuskasi.
 * @param {string} username
 */
export function saveUsernameToHistory(username) {
  if (!username?.trim()) return
  try {
    const clean   = username.trim()
    const raw     = localStorage.getItem(_UH_KEY)
    const decoded = raw
      ? JSON.parse(raw).map(_decodeUsername).filter(Boolean)
      : []
    const prev    = decoded.filter(u => u !== clean)
    const next    = [clean, ...prev].slice(0, 8)
    localStorage.setItem(_UH_KEY, JSON.stringify(next.map(_encodeUsername).filter(Boolean)))
  } catch { /* silent */ }
}

/**
 * Baca riwayat username (sudah di-decode).
 * @returns {string[]}
 */
export function loadUsernameHistory() {
  try {
    const raw = localStorage.getItem(_UH_KEY)
    if (!raw) return []
    return JSON.parse(raw).map(_decodeUsername).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Hapus seluruh riwayat username.
 */
export function clearUsernameHistory() {
  localStorage.removeItem(_UH_KEY)
}

// ── User Session Storage ──────────────────────────────────────────────────────
// Simpan data user di sessionStorage (bukan localStorage):
//   - sessionStorage clear otomatis saat tab/browser ditutup
//   - Key yang tidak deskriptif mempersulit script oportunistik
//   - Hanya simpan field yang DIPERLUKAN untuk display UI

const _USER_KEY = '_pkar_u'

/**
 * Simpan data user minimal ke sessionStorage.
 * Field di-map ke key pendek agar tidak mudah dibaca.
 *
 * @param {object} userData - Data user dari /auth/me atau /auth/login
 */
export function saveUserToStorage(userData) {
  if (!userData) return
  try {
    const minimal = {
      n: userData.nama,    // nama
      b: userData.bagian,  // bagian/departemen (untuk display)
      k: userData.kode,    // kode user (untuk isOwner check)
      r: userData.is_hrd,  // role flag (0 atau 1)
    }
    sessionStorage.setItem(_USER_KEY, JSON.stringify(minimal))
    // Bersihkan localStorage lama jika masih ada dari versi sebelumnya
    localStorage.removeItem('user')
  } catch { /* silent */ }
}

/**
 * Baca data user dari sessionStorage, kembalikan dengan field nama asli.
 * @returns {object|null}
 */
export function loadUserFromStorage() {
  try {
    // Coba sessionStorage dulu (format baru)
    const raw = sessionStorage.getItem(_USER_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      return { nama: d.n, bagian: d.b, kode: d.k, is_hrd: d.r }
    }
    // Fallback: localStorage lama (format lama — akan di-migrate saat login berikutnya)
    const legacy = localStorage.getItem('user')
    if (legacy) return JSON.parse(legacy)
    return null
  } catch {
    return null
  }
}

/**
 * Hapus data user dari semua storage.
 */
export function clearUserFromStorage() {
  try {
    sessionStorage.removeItem(_USER_KEY)
    localStorage.removeItem('user') // bersihkan format lama
  } catch { /* silent */ }
}