import { format, parseISO, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

// ── DATE FORMATTING ──────────────────────────────────────────────────────────
export function formatDate(dateStr, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '–'
  try {
    const d = typeof dateStr === 'string' && dateStr.includes('T')
      ? parseISO(dateStr)
      : new Date(dateStr)
    return isValid(d) ? format(d, fmt, { locale: id }) : dateStr
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr, 'dd MMM yyyy HH:mm')
}

export function toApiDate(millis) {
  if (!millis) return ''
  const d = new Date(millis)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── STATUS HELPERS ────────────────────────────────────────────────────────────
export function getApprovalStatus(atasan, hrd) {
  if (atasan === 2 || hrd === 2) return { label: 'Ditolak', color: 'badge-red' }
  if (atasan === 0)              return { label: 'Pending Atasan', color: 'badge-yellow' }
  if (hrd === 0)                 return { label: 'Pending HRD', color: 'badge-orange' }
  return { label: 'Disetujui', color: 'badge-green' }
}

export function getSlaStatusMeta(tag) {
  const map = {
    COMPLETED:        { label: 'Selesai',        color: 'badge-green',  bg: '#f0fdf4', text: '#166534' },
    NEED_USER_UPDATE: { label: 'Perlu Update',   color: 'badge-orange', bg: '#fff7ed', text: '#c2410c' },
    OVERDUE:          { label: 'Terlambat',      color: 'badge-red',    bg: '#fef2f2', text: '#991b1b' },
    CRITICAL:         { label: 'Kritis',         color: 'badge-red',    bg: '#fef2f2', text: '#b91c1c' },
    WARNING:          { label: 'Perhatian',      color: 'badge-yellow', bg: '#fffbeb', text: '#92400e' },
    ON_PROGRESS:      { label: 'Berjalan',       color: 'badge-blue',   bg: '#eff6ff', text: '#1e40af' },
  }
  return map[tag] ?? { label: tag ?? '–', color: 'badge-gray', bg: '#f8fafc', text: '#475569' }
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
  if (days < 0)   return '#d32f2f'
  if (days <= 3)  return '#ff4444'
  if (days <= 7)  return '#f57c00'
  return '#2e7d32'
}

// ── NUMBER HELPERS ────────────────────────────────────────────────────────────
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}