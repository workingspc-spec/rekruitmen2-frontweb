import { format, parseISO, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

// ── DATE ─────────────────────────────────────────────────────────────────────
/**
 * Format date string ke tampilan yang mudah dibaca.
 * Handle semua format:
 *  - ISO: "2026-02-11T08:05:21.000Z"
 *  - Space-separated (tanpa T): "2026-02-12 18:47:00" → parse sebagai LOCAL time
 *  - Date only: "2026-02-11"
 * Identik dengan DateUtils.formatDate() di Android
 */
export function formatDate(dateStr, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '–'
  try {
    let d
    if (typeof dateStr === 'string') {
      if (dateStr.includes('T')) {
        // ISO-8601 → parseISO handles timezone correctly
        d = parseISO(dateStr)
      } else if (dateStr.includes(' ') && dateStr.length > 10) {
        // "2026-02-12 18:47:00" — parse sebagai LOCAL time (bukan UTC)
        // Identik Android: sdfInput.timeZone = TimeZone.getDefault()
        const [datePart, timePart = '00:00:00'] = dateStr.split(' ')
        const [y, m, day] = datePart.split('-').map(Number)
        const [h, min, sec = 0] = timePart.split(':').map(Number)
        d = new Date(y, m - 1, day, h, min, sec)
      } else {
        // "2026-02-11" — tambah T00:00:00 agar parse sebagai local time
        d = new Date(dateStr + 'T00:00:00')
      }
    } else {
      d = new Date(dateStr)
    }
    return isValid(d) ? format(d, fmt, { locale: id }) : String(dateStr)
  } catch {
    return String(dateStr)
  }
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr, 'dd MMM yyyy HH:mm')
}

/**
 * Convert millis ke string tanggal API (YYYY-MM-DD).
 * PENTING: gunakan LOCAL time methods, bukan UTC — identik Android millisToDateString().
 * Sebelumnya pakai d.getUTCFullYear() yang menyebabkan timezone-shift di WIB (UTC+7).
 */
export function toApiDate(millis) {
  if (!millis) return ''
  const d   = new Date(millis)
  const y   = d.getFullYear()                            // ← LOCAL (was getUTCFullYear)
  const m   = String(d.getMonth() + 1).padStart(2, '0') // ← LOCAL (was getUTCMonth)
  const day = String(d.getDate()).padStart(2, '0')        // ← LOCAL (was getUTCDate)
  return `${y}-${m}-${day}`
}

// ── STATUS ────────────────────────────────────────────────────────────────────
export function getApprovalStatus(atasan, hrd) {
  if (atasan === 2 || hrd === 2) return { label: 'Ditolak',       color: 'badge-red'    }
  if (atasan === 0)              return { label: 'Pending Atasan', color: 'badge-yellow' }
  if (hrd === 0)                 return { label: 'Pending HRD',   color: 'badge-orange' }
  return                                { label: 'Disetujui',     color: 'badge-green'  }
}

export function getSlaStatusMeta(tag) {
  const map = {
    COMPLETED:        { label: 'Selesai',      bg: '#f0fdf4', text: '#166534' },
    NEED_USER_UPDATE: { label: 'Perlu Update', bg: '#fff7ed', text: '#c2410c' },
    OVERDUE:          { label: 'Terlambat',    bg: '#fef2f2', text: '#991b1b' },
    CRITICAL:         { label: 'Kritis',       bg: '#fef2f2', text: '#b91c1c' },
    WARNING:          { label: 'Perhatian',    bg: '#fffbeb', text: '#92400e' },
    ON_PROGRESS:      { label: 'Berjalan',     bg: '#eff6ff', text: '#1e40af' },
  }
  return map[tag] ?? { label: tag ?? '–', bg: '#f8fafc', text: '#475569' }
}

export function getPerformanceMeta(perf) {
  const map = {
    EXCELLENT:       { label: 'Excellent',       bg: '#f0fdf4', text: '#166534' },
    GOOD:            { label: 'Good',            bg: '#eff6ff', text: '#1e40af' },
    ACCEPTABLE:      { label: 'Acceptable',      bg: '#fffbeb', text: '#92400e' },
    DELAY:           { label: 'Delay',           bg: '#fef2f2', text: '#991b1b' },
    FAST_TRACK:      { label: 'Fast Track',      bg: '#f0fdf4', text: '#166534' },
    STANDARD_REVIEW: { label: 'Standard Review', bg: '#eff6ff', text: '#1e40af' },
    EXTENDED_REVIEW: { label: 'Extended Review', bg: '#fff7ed', text: '#c2410c' },
  }
  return map[perf] ?? { label: perf ?? '–', bg: '#f8fafc', text: '#475569' }
}

export function getDaysColor(days) {
  if (days < 0)  return '#d32f2f'
  if (days <= 3) return '#ff4444'
  if (days <= 7) return '#f57c00'
  return '#2e7d32'
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}