import { format, parseISO, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

// ── DATE ─────────────────────────────────────────────────────────────────────
export function formatDate(dateStr, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '–'
  try {
    let d
    if (typeof dateStr === 'string') {
      if (dateStr.includes('T')) {
        d = parseISO(dateStr)
      } else if (dateStr.includes(' ') && dateStr.length > 10) {
        const [datePart, timePart = '00:00:00'] = dateStr.split(' ')
        const [y, m, day] = datePart.split('-').map(Number)
        const [h, min, sec = 0] = timePart.split(':').map(Number)
        d = new Date(y, m - 1, day, h, min, sec)
      } else {
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

export function toApiDate(millis) {
  if (!millis) return ''
  const d   = new Date(millis)
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── STATUS ────────────────────────────────────────────────────────────────────

/**
 * getApprovalStatus — konversi angka tpk_approveatasan & tpk_approveHRD ke label + warna.
 *
 * ✅ STATUS BAYANGAN:
 *   tpk_approveatasan = 9 → Disetujui Atasan, menunggu HRD
 *   Tampilkan sebagai "Pending HRD" (sama dengan kondisi hrd === 0 setelah atasan approve)
 */
export function getApprovalStatus(atasan, hrd) {
  if (atasan === 2 || hrd === 2) return { label: 'Ditolak',       color: 'badge-red'    }
  if (atasan === 0)              return { label: 'Pending Atasan', color: 'badge-yellow' }
  // ✅ STATUS BAYANGAN: angka 9 = disetujui atasan, menunggu HRD
  if (atasan === 9 && hrd === 0) return { label: 'Pending HRD',   color: 'badge-orange' }
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

/**
 * getSlaSourceMeta — utility terpusat untuk pewarnaan badge sla_source.
 */
export function getSlaSourceMeta(source) {
  const map = {
    SYSTEM:   { label: 'Disesuaikan Sistem', bg: '#fff7ed', text: '#c2410c' },
    USER:     { label: 'Sesuai Permintaan',  bg: '#f0fdf4', text: '#166534' },
    FLEXIBLE: { label: 'Jabatan Fleksibel',  bg: '#eff6ff', text: '#1e40af' },
  }
  return map[source] ?? { label: source ?? '–', bg: '#f1f5f9', text: '#475569' }
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