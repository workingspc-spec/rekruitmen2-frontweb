const HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-02-17', '2026-03-11', '2026-03-22',
  '2026-03-31', '2026-04-01', '2026-04-02', '2026-04-03',
  '2026-04-10', '2026-05-01', '2026-05-06', '2026-05-26',
  '2026-06-01', '2026-06-07', '2026-06-28', '2026-08-17',
  '2026-09-06', '2026-12-25',
])

function fmt(d) {
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isWeekend(d) { return d.getDay() === 0 }
function isHoliday(d) { return HOLIDAYS_2026.has(fmt(d)) }
function isWorkday(d) { return !isWeekend(d) && !isHoliday(d) }

export function addWorkdays(startDate, days) {
  const d = new Date(startDate)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (isWorkday(d)) added++
  }
  return d
}

/**
 * Calculate min allowed date from job rules + quantity
 * Mirrors backend logic exactly
 */
export function getMinAllowedDate(jabKode, jabatanRules, jumlah = 1) {
  const rule = jabatanRules?.find(r => r.jab_kode === jabKode)
  if (!rule || rule.is_flexible) return null

  let minDays = rule.min_days ?? 7

  // Bulk buffer — identical to backend
  if (jumlah > 1) {
    if (jumlah <= 3)      minDays += 3
    else if (jumlah <= 5) minDays += 6
    else                  minDays += 6 + (jumlah - 5)
  }

  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  return addWorkdays(tomorrow, minDays - 1)
}

/**
 * Validate tgl_butuh against job rules
 */
// src/utils/workday.js — Perbaikan validateTglButuh
export function validateTglButuh(tglButuh, jabKode, jabatanRules, jumlah = 1, isReSchedule = false) {
  if (!tglButuh) return { valid: false, message: 'Pilih tanggal terlebih dahulu.' }

  const [y, m, d] = tglButuh.split('-').map(Number)
  const requested = new Date(y, m - 1, d)
  const today     = new Date(); today.setHours(0, 0, 0, 0)

  // RE-SCHEDULE MODE: cukup >= hari ini
  if (isReSchedule) {
    return requested >= today
      ? { valid: true }
      : { valid: false, message: 'Untuk re-schedule, tanggal minimal adalah hari ini.' }
  }

  const rule = jabatanRules?.find(r => r.jab_kode === jabKode)
  if (!rule || rule.is_flexible) return { valid: true }

  const minDate = getMinAllowedDate(jabKode, jabatanRules, jumlah)
  if (!minDate) return { valid: true }

  if (requested < minDate) {
    const fmtD = (dt) =>
      `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`

    // Pesan yang identik dengan Mobile
    let msg = `Tanggal butuh minimal ${rule.min_days} hari kerja dari besok.`
    if (jumlah > 1) {
      const extra = jumlah <= 3 ? 3 : jumlah <= 5 ? 6 : 6 + (jumlah - 5)
      msg = `Tanggal butuh minimal ${rule.min_days} hari kerja (+${extra} hari buffer massal ${jumlah} orang).`
    }
    return { valid: false, message: `${msg} Saran: ${fmtD(minDate)}`, minDate }
  }

  return { valid: true }
}