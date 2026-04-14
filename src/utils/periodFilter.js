/**
 * periodFilter.js
 *
 * Utilitas terpusat untuk filter periode (period filter) berbasis tanggal.
 * Sebelumnya kode ini diduplikasi di SlaStatusListPage, ApprovalListPage,
 * dan RecruitmentListPage dengan sedikit variasi yang berpotensi menyebabkan
 * inkonsistensi. Semua halaman kini mengimpor dari sini.
 *
 * Format period yang didukung:
 *   - null / '' / 'All Time'          → semua data
 *   - 'Today', 'Yesterday'
 *   - 'This week', 'Last week'
 *   - 'This month', 'Last month'
 *   - 'This year', 'Last year'
 *   - 'Custom: 2026-01-01 - 2026-03-31'  (dari PeriodPickerModal)
 *   - '2026-01-01,2026-03-31'            (dari Dashboard params)
 *   - '2026-01-01'                        (single-date filter)
 */

export const PERIOD_OPTIONS = [
  { value: null,          label: 'Semua Waktu' },
  { value: 'Today',       label: 'Hari Ini'    },
  { value: 'Yesterday',   label: 'Kemarin'     },
  { value: 'This week',   label: 'Minggu Ini'  },
  { value: 'Last week',   label: 'Minggu Lalu' },
  { value: 'This month',  label: 'Bulan Ini'   },
  { value: 'Last month',  label: 'Bulan Lalu'  },
  { value: 'This year',   label: 'Tahun Ini'   },
  { value: 'Last year',   label: 'Tahun Lalu'  },
]

/**
 * Cocokkan sebuah tanggal (string 'YYYY-MM-DD' atau ISO) dengan period filter.
 *
 * @param {string|null} dateStr  - Tanggal item (boleh ISO 8601 lengkap)
 * @param {string|null} period   - Nilai period filter
 * @returns {boolean}
 */
export function matchesPeriodFilter(dateStr, period) {
  if (!dateStr || !period || period === 'All Time') return true

  let itemDate
  try {
    itemDate = new Date(dateStr.substring(0, 10) + 'T00:00:00')
    if (isNaN(itemDate.getTime())) return true
  } catch {
    return true
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Normalisasi period: URLSearchParams.get() sudah decode '+' → ' '
  // sehingga 'this+month' tidak akan muncul di sini. Kita lowercase saja
  // untuk keamanan.
  const p = period.toLowerCase()

  switch (p) {
    case 'today':
      return itemDate.toDateString() === today.toDateString()

    case 'yesterday': {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return itemDate.toDateString() === y.toDateString()
    }

    case 'this week': {
      const mon = new Date(today)
      mon.setDate(today.getDate() - (today.getDay() || 7) + 1)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return itemDate >= mon && itemDate <= sun
    }

    case 'last week': {
      const mon = new Date(today)
      mon.setDate(today.getDate() - (today.getDay() || 7) - 6)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return itemDate >= mon && itemDate <= sun
    }

    case 'this month':
      return (
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getFullYear() === today.getFullYear()
      )

    case 'last month': {
      const lm = new Date(today)
      lm.setMonth(lm.getMonth() - 1)
      return (
        itemDate.getMonth() === lm.getMonth() &&
        itemDate.getFullYear() === lm.getFullYear()
      )
    }

    case 'this year':
      return itemDate.getFullYear() === today.getFullYear()

    case 'last year':
      return itemDate.getFullYear() === today.getFullYear() - 1

    default: {
      // Custom range: 'custom: 2026-01-01 - 2026-03-31'
      //           atau '2026-01-01,2026-03-31' (dari Dashboard navigateWithPeriod)
      let rangeStr = p
      if (rangeStr.startsWith('custom:')) {
        rangeStr = rangeStr.replace('custom:', '').trim()
      }

      // Normalise separator: bisa ' - ' atau ','
      const parts = rangeStr.includes(',')
        ? rangeStr.split(',')
        : rangeStr.split(' - ')

      if (parts.length === 2) {
        const start = new Date(parts[0].trim() + 'T00:00:00')
        const end   = new Date(parts[1].trim() + 'T00:00:00')
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return itemDate >= start && itemDate <= end
        }
      }

      // Single date: '2026-01-15'
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) {
        const single = new Date(p + 'T00:00:00')
        return itemDate.toDateString() === single.toDateString()
      }

      return true
    }
  }
}

/**
 * Konversi nilai period ke label yang mudah dibaca pengguna.
 *
 * @param {string|null} period
 * @returns {string}
 */
export function periodToLabel(period) {
  if (!period || period === 'All Time') return 'Semua Waktu'

  const match = PERIOD_OPTIONS.find(o => o.value === period)
  if (match) return match.label

  const pLower = period.toLowerCase()

  if (pLower.startsWith('custom:')) {
    try {
      const rangeStr = period.replace(/custom:/i, '').trim()
      const parts    = rangeStr.includes(',')
        ? rangeStr.split(',')
        : rangeStr.split(' - ')

      if (parts.length >= 2) {
        const fmt = (s) =>
          new Date(s.trim() + 'T00:00:00').toLocaleDateString('id-ID', {
            day:   '2-digit',
            month: 'short',
            year:  'numeric',
          })
        return `${fmt(parts[0])} – ${fmt(parts[1])}`
      }
    } catch {
      return 'Rentang Kustom'
    }
  }

  // Single date
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    try {
      return new Date(period + 'T00:00:00').toLocaleDateString('id-ID', {
        day:   '2-digit',
        month: 'short',
        year:  'numeric',
      })
    } catch {
      return period
    }
  }

  return period
}

/**
 * Konversi nilai period ke parameter API (untuk di-pass ke backend).
 * Backend monitoring dan dashboard mendukung format ini.
 *
 * @param {string|null} period
 * @returns {string|undefined}
 */
export function periodToApiParam(period) {
  if (!period || period === 'All Time') return undefined

  if (period.startsWith('Custom:') || period.startsWith('custom:')) {
    return period.replace(/custom:/i, '').trim().replace(' - ', ',')
  }

  return period
}