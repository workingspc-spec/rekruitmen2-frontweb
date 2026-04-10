// src/pages/recruitment/RecruitmentFormPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi, recruitmentApi } from '../../api/services'
import { validateTglButuh, getMinAllowedDate } from '../../utils/workday'
import { formatDate, toApiDate } from '../../utils/helpers'
import {
  Save, Lock, Info, Calendar, ChevronDown,
  Plus, Minus, AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
// Tambahkan fungsi date-fns ini di baris import
// src/pages/recruitment/RecruitmentFormPage.jsx
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, 
  isSameMonth, isSameDay, isBefore, isAfter, addMonths, subMonths, 
  setYear, setMonth, subYears, addYears 
} from 'date-fns';
import { id } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react' // Pastikan ini di-import


// ── Modern Single Date Picker Modal ──────────────────────────────────────────
function DatePickerModal({ value, onChange, onClose, min }) {
  const initialDate = value ? new Date(value) : new Date()
  const [viewDate, setViewDate] = useState(initialDate)
  const [viewMode, setViewMode] = useState('days') // 'days' | 'months' | 'years'
  const today = new Date(); today.setHours(0,0,0,0)

  // Builder grid hari
  const buildDays = (date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 })
    const days = []; let d = start;
    while (!isAfter(d, end)) { days.push(d); d = addDays(d, 1) }
    return days
  }
  const days = buildDays(viewDate)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const years = Array.from({ length: 12 }, (_, i) => viewDate.getFullYear() - 5 + i)

  const handlePrev = () => {
    if (viewMode === 'days') setViewDate(d => subMonths(d, 1))
    else if (viewMode === 'years') setViewDate(d => subYears(d, 12))
    else setViewDate(d => subYears(d, 1))
  }
  const handleNext = () => {
    if (viewMode === 'days') setViewDate(d => addMonths(d, 1))
    else if (viewMode === 'years') setViewDate(d => addYears(d, 12))
    else setViewDate(d => addYears(d, 1))
  }

  const handleDayClick = (day) => {
    if (min && isBefore(day, min) && !isSameDay(day, min)) return; // Validasi min date
    onChange(format(day, 'yyyy-MM-dd'))
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[22rem] p-5">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={16} />
          </button>
          
          <button
            onClick={() => {
              if (viewMode === 'days') setViewMode('months')
              else if (viewMode === 'months') setViewMode('years')
              else setViewMode('days')
            }}
            className="text-[15px] font-bold text-navy capitalize hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors"
          >
            {viewMode === 'days' ? format(viewDate, 'MMMM yyyy', { locale: id }) :
             viewMode === 'months' ? format(viewDate, 'yyyy') :
             `${years[0]} - ${years[years.length - 1]}`}
          </button>

          <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="min-h-[220px]">
          {/* DAYS VIEW */}
          {viewMode === 'days' && (
            <>
              <div className="grid grid-cols-7 mb-2">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {days.map((day, i) => {
                  const inMonth = isSameMonth(day, viewDate)
                  const isSelected = value && isSameDay(day, initialDate)
                  const isToday = isSameDay(day, today)
                  const isDisabled = min && isBefore(day, min) && !isSameDay(day, min)

                  let textClass = 'text-slate-600 hover:bg-slate-50'
                  if (!inMonth) textClass = 'text-slate-300'
                  if (isDisabled) textClass = 'text-slate-200 cursor-not-allowed bg-slate-50/50'
                  if (isSelected) textClass = 'bg-sapphire text-white font-bold shadow-md hover:bg-sapphire'
                  else if (isToday) textClass += ' font-bold text-sapphire border border-sapphire/30'

                  return (
                    <button
                      key={i} onClick={() => inMonth && !isDisabled && handleDayClick(day)} disabled={!inMonth || isDisabled}
                      className={`h-9 w-9 mx-auto rounded-full text-xs flex items-center justify-center transition-all ${textClass}`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* MONTHS VIEW */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2">
              {months.map((m, i) => (
                <button
                  key={m} onClick={() => { setViewDate(setMonth(viewDate, i)); setViewMode('days') }}
                  className={`py-3 text-sm font-semibold rounded-xl transition-colors ${viewDate.getMonth() === i ? 'bg-sapphire text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* YEARS VIEW */}
          {viewMode === 'years' && (
            <div className="grid grid-cols-3 gap-2">
              {years.map((y) => (
                <button
                  key={y} onClick={() => { setViewDate(setYear(viewDate, y)); setViewMode('months') }}
                  className={`py-3 text-sm font-semibold rounded-xl transition-colors ${viewDate.getFullYear() === y ? 'bg-sapphire text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <button className="btn-ghost text-sm px-4" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Dropdown Modal ────────────────────────────────────────────────────────────
function DropdownModal({ title, items, itemKey, itemLabel, selected, onSelect, onClose, searchable }) {
  const [q, setQ] = useState('')
  const filtered = q ? items.filter(i => itemLabel(i).toLowerCase().includes(q.toLowerCase())) : items

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1 text-slate-400">✕</button>
        </div>
        {searchable && (
          <div className="px-5 pt-3">
            <input className="input" placeholder="Cari..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {filtered.map(item => (
            <button
              key={itemKey(item)}
              onClick={() => { onSelect(item); onClose() }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                itemKey(item) === (selected && itemKey(selected))
                  ? 'bg-sapphire/10 text-sapphire font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              {itemLabel(item)}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main Form ─────────────────────────────────────────────────────────────────
export default function RecruitmentFormPage() {
  const { nomor } = useParams()
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const isEdit    = Boolean(nomor)

  const { data: jabatanList = [] } = useQuery({
    queryKey: ['jabatan'],
    queryFn: () => masterApi.jabatan().then(r => r.data.data ?? []),
  })
  const { data: bagianList = [] } = useQuery({
    queryKey: ['bagian'],
    queryFn: () => masterApi.bagian().then(r => r.data.data ?? []),
  })
  const { data: jabatanRules = [] } = useQuery({
    queryKey: ['jabatan-rules'],
    queryFn: () => masterApi.jabatanRules().then(r => r.data.data ?? []),
  })
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['recruitment-detail', nomor],
    queryFn: () => recruitmentApi.detail(nomor).then(r => r.data.data),
    enabled: isEdit,
  })

  const [jabatan,      setJabatan]      = useState(null)
  const [bagian,       setBagian]       = useState('')
  const [tglButuh,     setTglButuh]     = useState('')
  const [jumlah,       setJumlah]       = useState(1)
  const [alasan,       setAlasan]       = useState('')
  const [ketList,      setKetList]      = useState(Array(10).fill(''))
  const [specList,     setSpecList]     = useState(Array(10).fill(''))
  const [visKet,       setVisKet]       = useState(3)
  const [visSpec,      setVisSpec]      = useState(3)
  const [isLocked,     setIsLocked]     = useState(false)
  const [isReSchedule, setIsReSchedule] = useState(false)
  const [slaInfo,      setSlaInfo]      = useState(null)

  const [showJabatan,    setShowJabatan]    = useState(false)
  const [showBagian,     setShowBagian]     = useState(false)
  const [showAlasan,     setShowAlasan]     = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    if (!detail) return
    const found = jabatanList.find(j => j.jab_kode === detail.jab_kode || j.jab_kode === detail.tpk_jab_kode)
    setJabatan(found ?? { jab_kode: detail.tpk_jab_kode || detail.jab_kode, jab_nama: detail.jab_nama })
    setBagian(detail.tpk_bagian || '')
    setTglButuh(detail.tpk_tgl_butuh || '')
    setJumlah(Number(detail.tpk_jumlah) || 1)
    setAlasan(detail.tpk_alasan || '')

    const kets = Array(10).fill('')
    for (let i = 0; i < 10; i++) kets[i] = detail[`tpk_keterangan${i === 0 ? '' : i + ''}`] || ''
    setKetList(kets)

    const specs = Array(10).fill('')
    for (let i = 0; i < 10; i++) specs[i] = detail[`tpk_spesifikasi${i === 0 ? '' : i + ''}`] || ''
    setSpecList(specs)

    const filledKet  = kets.filter(Boolean).length
    const filledSpec = specs.filter(Boolean).length
    setVisKet(Math.max(3, filledKet))
    setVisSpec(Math.max(3, filledSpec))

    const isDraft  = detail.tpk_approveatasan === 0 && detail.tpk_approveHRD === 0
    const editable = detail.sla_is_editable === 1
    setIsLocked(!isDraft && !editable)
    setIsReSchedule(editable)
    setSlaInfo(editable ? {
      isEditable: true,
      notes: detail.sla_notes,
      finalTargetDate: detail.sla_final_target_date,
    } : null)
  }, [detail, jabatanList])

  const validation = useCallback(() => {
    if (!jabatan || !tglButuh) return null
    return validateTglButuh(tglButuh, jabatan.jab_kode, jabatanRules, jumlah, isReSchedule)
  }, [jabatan, tglButuh, jabatanRules, jumlah, isReSchedule])

  const vlResult = validation()
  const minDate  = jabatan ? (getMinAllowedDate(jabatan.jab_kode, jabatanRules, jumlah) ?? null) : null

  const handleJumlahChange = (delta) => {
    setJumlah(prev => Math.max(1, prev + delta))
  }

  const saveMut = useMutation({
    mutationFn: (body) => recruitmentApi.save(body),
    onSuccess: () => {
      toast.success(isEdit ? 'Permintaan berhasil diperbarui!' : 'Permintaan berhasil dibuat!')
      // FIX: Invalidate queries termasuk dashboard agar data terupdate
      // Audit: RecruitmentFormPage.jsx — setelah save berhasil, dashboard tidak di-refresh
      // Android: emit DashboardRefresh + RecruitmentListRefresh via RefreshEventBus
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })    // ← TAMBAHAN
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })  // ← TAMBAHAN
      navigate('/recruitment')
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal menyimpan.'),
  })

  const handleSave = () => {
    if (!jabatan)  { toast.error('Pilih jabatan terlebih dahulu.'); return }
    if (!bagian)   { toast.error('Pilih bagian terlebih dahulu.'); return }
    if (!tglButuh) { toast.error('Tentukan tanggal butuh.'); return }
    if (jumlah < 1 || isNaN(jumlah)) { toast.error('Jumlah tidak valid.'); return }
    if (!alasan && !isEdit) { toast.error('Pilih alasan permintaan.'); return }
    if (vlResult && !vlResult.valid) { toast.error(vlResult.message); return }

    const [k1,k2,k3,k4,k5,k6,k7,k8,k9,k10] = ketList
    const [s1,s2,s3,s4,s5,s6,s7,s8,s9,s10] = specList

    saveMut.mutate({
      tpk_nomor: nomor || undefined,
      jab_kode: jabatan.jab_kode,
      bagian, tgl_butuh: tglButuh, jumlah,
      alasan: alasan || null, alasan_lain: null,
      tpk_keterangan:   k1||null, tpk_keterangan2:  k2||null,  tpk_keterangan3:  k3||null,
      tpk_keterangan4:  k4||null, tpk_keterangan5:  k5||null,  tpk_keterangan6:  k6||null,
      tpk_keterangan7:  k7||null, tpk_keterangan8:  k8||null,  tpk_keterangan9:  k9||null,
      tpk_keterangan10: k10||null,
      tpk_spesifikasi:   s1||null, tpk_spesifikasi2:  s2||null,  tpk_spesifikasi3:  s3||null,
      tpk_spesifikasi4:  s4||null, tpk_spesifikasi5:  s5||null,  tpk_spesifikasi6:  s6||null,
      tpk_spesifikasi7:  s7||null, tpk_spesifikasi8:  s8||null,  tpk_spesifikasi9:  s9||null,
      tpk_spesifikasi10: s10||null,
    })
  }

  if (isEdit && detailLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-sapphire" />
    </div>
  )

  const ALASAN_OPTS = ['Penambahan Karyawan', 'Penggantian Karyawan Keluar', 'Resign', 'Ekspansi', 'Lainnya']

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Permintaan' : 'Buat Permintaan'}</h1>
          {isEdit && <p className="text-xs text-slate-400 font-mono mt-0.5">{nomor}</p>}
        </div>
        <button onClick={handleSave} disabled={saveMut.isPending || isLocked} className="btn-primary">
          {saveMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saveMut.isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {isLocked && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <Lock size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Form Terkunci</p>
            <p className="text-xs text-red-500 mt-0.5">Permintaan telah disetujui atasan. Data utama tidak dapat diubah.</p>
          </div>
        </div>
      )}

      {slaInfo?.isEditable && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <Info size={18} className="text-sapphire shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sapphire text-sm">Re-schedule Diizinkan</p>
            <p className="text-xs text-slate-600 mt-0.5">{slaInfo.notes || 'Anda dapat mengubah tanggal target.'}</p>
            {slaInfo.finalTargetDate && (
              <p className="text-xs text-slate-400 mt-1">Target saat ini: {formatDate(slaInfo.finalTargetDate)}</p>
            )}
          </div>
        </div>
      )}

      <Section title="Informasi Jabatan">
        <div className="space-y-3">
          <FieldButton label="Jabatan" value={jabatan?.jab_nama} placeholder="Pilih Jabatan"
            locked={isReSchedule || isLocked} onClick={() => !isReSchedule && !isLocked && setShowJabatan(true)} />
          <FieldButton label="Bagian / Departemen" value={bagian} placeholder="Pilih Bagian"
            locked={isReSchedule || isLocked} onClick={() => !isReSchedule && !isLocked && setShowBagian(true)} />
        </div>
      </Section>

      <Section title="Kebutuhan">
        <div className="space-y-3">
          <div>
            <label className="label">Jumlah Karyawan</label>
            <div className="flex items-center gap-3">
              <button className="btn-ghost p-2 rounded-xl border border-slate-200"
                onClick={() => handleJumlahChange(-1)} disabled={isReSchedule || isLocked || jumlah <= 1}>
                <Minus size={16} />
              </button>
              <span className="text-2xl font-display font-bold text-navy w-12 text-center">{jumlah}</span>
              <button className="btn-ghost p-2 rounded-xl border border-slate-200"
                onClick={() => handleJumlahChange(1)} disabled={isReSchedule || isLocked}>
                <Plus size={16} />
              </button>
              <span className="text-sm text-slate-400">orang</span>
            </div>
            {jumlah > 1 && !isReSchedule && !isLocked && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Permintaan massal {jumlah} orang — lead time akan ditambah buffer ekstra untuk koordinasi.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Tanggal Dibutuhkan</label>
            <button
              onClick={() => !isLocked && setShowDatePicker(true)}
              className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm transition-all
                ${isLocked ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-sapphire cursor-pointer'}
                border-slate-200`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span className={tglButuh ? 'text-navy' : 'text-slate-400'}>
                  {tglButuh ? formatDate(tglButuh) : 'Pilih Tanggal'}
                </span>
              </div>
              {isLocked ? <Lock size={14} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {/* Validasi tanggal — identik Android validateTanggalButuhUseCase */}
            {jabatan && tglButuh && vlResult && (
              <div className={`mt-1.5 flex items-start gap-1.5 text-xs ${vlResult.valid ? 'text-green-600' : 'text-red-500'}`}>
                {vlResult.valid
                  ? <><CheckCircle2 size={13} className="mt-0.5 shrink-0" /> Sesuai target lead time HRD</>
                  : <><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {vlResult.message}</>
                }
              </div>
            )}

            {/* Hint tanggal minimal */}
            {jabatan && !tglButuh && minDate && !isReSchedule && (
              <p className="mt-1 text-xs text-slate-400">
                Minimal: {formatDate(toApiDate(minDate.getTime()))}
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Alasan Permintaan">
        <FieldButton label="Alasan" value={alasan} placeholder="Pilih Alasan"
          locked={isReSchedule || isLocked} onClick={() => !isReSchedule && !isLocked && setShowAlasan(true)} />
      </Section>

      <Section title="Keterangan Pekerjaan (Opsional)">
        <div className="space-y-2">
          {ketList.slice(0, visKet).map((v, i) => (
            <input key={i} className="input" placeholder={`Keterangan ${i + 1}`} value={v}
              disabled={isReSchedule || isLocked}
              onChange={e => { const n = [...ketList]; n[i] = e.target.value; setKetList(n) }} />
          ))}
          {visKet < 10 && !isLocked && !isReSchedule && (
            <button className="btn-ghost text-xs" onClick={() => setVisKet(v => v + 1)}>
              <Plus size={14} /> Tambah Baris
            </button>
          )}
        </div>
      </Section>

      <Section title="Spesifikasi yang Dibutuhkan (Opsional)">
        <div className="space-y-2">
          {specList.slice(0, visSpec).map((v, i) => (
            <input key={i} className="input" placeholder={`Spesifikasi ${i + 1}`} value={v}
              disabled={isReSchedule || isLocked}
              onChange={e => { const n = [...specList]; n[i] = e.target.value; setSpecList(n) }} />
          ))}
          {visSpec < 10 && !isLocked && !isReSchedule && (
            <button className="btn-ghost text-xs" onClick={() => setVisSpec(v => v + 1)}>
              <Plus size={14} /> Tambah Baris
            </button>
          )}
        </div>
      </Section>

      <div className="pt-2 pb-6">
        <button onClick={handleSave} disabled={saveMut.isPending || isLocked}
          className="btn-primary w-full justify-center h-11 text-base">
          {saveMut.isPending
            ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
            : <><Save size={18} /> Simpan Permintaan</>}
        </button>
      </div>

      {/* Modals */}
      {showJabatan && (
        <DropdownModal title="Pilih Jabatan" items={jabatanList}
          itemKey={j => j.jab_kode} itemLabel={j => j.jab_nama}
          selected={jabatan} onSelect={j => { setJabatan(j); setTglButuh('') }}
          onClose={() => setShowJabatan(false)} searchable />
      )}
      {showBagian && (
        <DropdownModal title="Pilih Bagian" items={bagianList.map(b => ({ val: b.kar_bagian }))}
          itemKey={b => b.val} itemLabel={b => b.val}
          selected={bagian ? { val: bagian } : null} onSelect={b => setBagian(b.val)}
          onClose={() => setShowBagian(false)} searchable />
      )}
      {showAlasan && (
        <DropdownModal title="Pilih Alasan" items={ALASAN_OPTS.map(a => ({ val: a }))}
          itemKey={a => a.val} itemLabel={a => a.val}
          selected={alasan ? { val: alasan } : null} onSelect={a => setAlasan(a.val)}
          onClose={() => setShowAlasan(false)} />
      )}
      {showDatePicker && (
        <DatePickerModal value={tglButuh} onChange={setTglButuh}
          onClose={() => setShowDatePicker(false)} min={minDate} />
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card space-y-4">
      <h3 className="font-display font-bold text-navy text-sm uppercase tracking-wide border-b border-slate-100 pb-2">{title}</h3>
      {children}
    </div>
  )
}

function FieldButton({ label, value, placeholder, locked, onClick }) {
  return (
    <div>
      <label className="label">{label}</label>
      <button onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm transition-all
          ${locked ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-sapphire cursor-pointer'}
          border-slate-200`}>
        <span className={value ? 'text-navy' : 'text-slate-400'}>{value || placeholder}</span>
        {locked ? <Lock size={14} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
    </div>
  )
}