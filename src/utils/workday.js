const HOLIDAYS_2026 = new Set([
  '2026-01-01','2026-02-17','2026-03-11','2026-03-22',
  '2026-03-31','2026-04-01','2026-04-02','2026-04-03',
  '2026-04-10','2026-05-01','2026-05-06','2026-05-26',
  '2026-06-01','2026-06-07','2026-06-28','2026-08-17',
  '2026-09-06','2026-12-25',
])

function fmt(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
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

export function getMinAllowedDate(jabKode, jabatanRules, jumlah = 1) {
  const rule = jabatanRules.find(r => r.jab_kode === jabKode)
  if (!rule) return null
  if (rule.is_flexible) return null  // no restriction

  let minDays = rule.min_days
  // Bulk buffer
  if (jumlah > 1) {
    if (jumlah <= 3)      minDays += 3
    else if (jumlah <= 5) minDays += 6
    else                  minDays += 6 + (jumlah - 5)
  }

  const today = new Date()
  today.setHours(0,0,0,0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return addWorkdays(tomorrow, minDays - 1)
}

export function validateTglButuh(tglButuh, jabKode, jabatanRules, jumlah = 1, isReSchedule = false) {
  const rule = jabatanRules.find(r => r.jab_kode === jabKode)
  const [y,m,d] = tglButuh.split('-').map(Number)
  const requested = new Date(y, m-1, d)
  const today = new Date(); today.setHours(0,0,0,0)

  if (isReSchedule) {
    return requested >= today
      ? { valid: true }
      : { valid: false, message: 'Untuk re-schedule, tanggal minimal hari ini.' }
  }

  if (!rule || rule.is_flexible) return { valid: true }

  const minDate = getMinAllowedDate(jabKode, jabatanRules, jumlah)
  if (!minDate) return { valid: true }

  if (requested < minDate) {
    const fmt2 = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
    return {
      valid: false,
      message: `Tanggal minimal ${rule.min_days} hari kerja. Saran: ${fmt2(minDate)}`,
      minDate,
    }
  }
  return { valid: true }
}