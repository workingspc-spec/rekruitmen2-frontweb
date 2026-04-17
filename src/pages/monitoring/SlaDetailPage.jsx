// src/pages/monitoring/SlaDetailPage.jsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { recruitmentApi, monitoringApi } from '../../api/services'
import { formatDate, getDaysColor } from '../../utils/helpers'
import { PageLoader, ErrorBox } from '../../components/ui'
import { getSlaStatusMeta } from '../../utils/helpers'
import {
  CheckCircle2, LockOpen, Lock, AlertTriangle, User,
  Calendar, Clock, Edit3, Info, Loader2, ChevronDown, ChevronUp,
  BellRing,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SlaDetailPage() {
  const { nomor }  = useParams()
  const { isHrd, user } = useAuth()
  const qc         = useQueryClient()

  const [showNoShow, setShowNoShow]     = useState(false)
  const [showEditable, setShowEditable] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [selectedRkt, setSelectedRkt]  = useState(null)
  const [historyOpen, setHistoryOpen]  = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sla-detail', nomor],
    queryFn: () => monitoringApi.slaDetail(nomor).then(r => r.data.data),
  })

  const { data: hiredData = [] } = useQuery({
    queryKey: ['hired-candidates', nomor],
    queryFn: () => recruitmentApi.hiredCandidates(nomor).then(r => r.data.data ?? []),
  })

  const cancelMut = useMutation({
    mutationFn: ({ rktNomor, bufferDays, keterangan }) =>
      recruitmentApi.cancelCandidate(nomor, { rktNomor, bufferDays, keterangan }),
    onSuccess: (_, vars) => {
      toast.success(`Kandidat dibatalkan. Buffer +${vars.bufferDays} hari dicatat.`)
      qc.invalidateQueries({ queryKey: ['sla-detail', nomor] })
      qc.invalidateQueries({ queryKey: ['hired-candidates', nomor] })
      setShowNoShow(false)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const editableMut = useMutation({
    mutationFn: ({ isEditable, keterangan }) =>
      recruitmentApi.setEditable(nomor, { isEditable, keterangan }),
    onSuccess: (_, vars) => {
      toast.success(vars.isEditable === 1 ? 'Izin edit dibuka.' : 'Izin edit ditutup.')
      qc.invalidateQueries({ queryKey: ['sla-detail', nomor] })
      setShowEditable(false)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const completeMut = useMutation({
    mutationFn: () => recruitmentApi.complete({ tpk_nomor: nomor }),
    onSuccess: () => {
      toast.success('Permintaan berhasil ditutup.')
      qc.invalidateQueries({ queryKey: ['sla-detail', nomor] })
      setShowComplete(false)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  if (isLoading) return <PageLoader />
  if (isError || !data) return <ErrorBox message="Gagal memuat detail SLA." onRetry={refetch} />

  const sla      = data.sla_info
  const timeline = data.timeline
  const history  = data.edit_history ?? []
  const approval = data.approval_info

  // ✅ BARU: Deteksi apakah current user adalah Atasan
  // tpk_peminta dari API = kode karyawan si peminta
  // Jika user bukan HRD dan user.kode berbeda dari peminta → Atasan
  const isAtasan = !isHrd && sla?.tpk_peminta && user?.kode !== sla?.tpk_peminta

  const daysRem     = Number(sla?.days_remaining ?? 0)
  const isCompleted = sla?.sla_status === 'COMPLETED'
  const isEditable  = sla?.sla_is_editable === 1
  const daysColor   = getDaysColor(daysRem)
  const meta        = getSlaStatusMeta(
    isCompleted ? 'COMPLETED'
    : isEditable ? 'NEED_USER_UPDATE'
    : daysRem < 0 ? 'OVERDUE'
    : daysRem <= 3 ? 'CRITICAL'
    : daysRem <= 7 ? 'WARNING'
    : 'ON_PROGRESS'
  )

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Detail SLA</h1>
          <p className="font-mono text-xs text-slate-400 mt-0.5">{nomor}</p>
        </div>
      </div>

      {/* Header Card */}
      <div className="card bg-gradient-to-br from-sapphire to-blue-700 text-white">
        <p className="font-display font-bold text-xl">{sla?.jab_nama}</p>
        <p className="text-blue-200 text-sm mt-0.5">{sla?.tpk_bagian} · {nomor}</p>
        <div className="flex items-center gap-4 mt-4">
          <Chip label={`${sla?.tpk_jumlah} Posisi`} />
          <Chip label={`Min ${sla?.sla_min_days}–${sla?.sla_max_days} hari`} />
        </div>
      </div>

      {/* Status Box */}
      <div className="card">
        <div className="rounded-xl p-6 text-center mb-4" style={{ background: meta.bg }}>
          <p className="text-5xl font-display font-black leading-none" style={{ color: meta.text }}>
            {isCompleted ? 'SELESAI' : daysRem < 0 ? 'TERLAMBAT' : daysRem === 0 ? 'HARI INI' : `${daysRem}`}
          </p>
          {!isCompleted && daysRem >= 0 && daysRem !== 0 && (
            <p className="text-sm mt-1" style={{ color: meta.text }}>hari tersisa</p>
          )}
          {daysRem < 0 && !isCompleted && (
            <p className="text-sm mt-1" style={{ color: meta.text }}>{-daysRem} hari melewati batas</p>
          )}
        </div>

        <div className="space-y-2">
          <StatusRow label="Status SLA" value={sla?.sla_status} />
          <StatusRow label="Sumber"     value={sla?.sla_source} />
          <StatusRow
            label="Editable"
            value={isEditable ? 'Ya – Perlu Update User' : 'Tidak'}
            valueColor={isEditable ? '#c2410c' : '#166534'}
          />
          {(sla?.sla_no_show_buffer_days ?? 0) > 0 && (
            <StatusRow label="Buffer No-Show" value={`+${sla.sla_no_show_buffer_days} hari`} valueColor="#f57c00" />
          )}
        </div>

        {approval?.approver_name && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approval</p>
            <StatusRow label="Disetujui Oleh" value={approval.approver_name} />
            <StatusRow label="Waktu Approval" value={`${approval.approval_delay_days} hari`} valueColor={getDaysColor(-(approval.approval_delay_days ?? 0))} />
            {approval.approval_flag === 'APPROVAL_DELAYED' && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-2">
                <Clock size={13} className="text-amber-600" />
                <p className="text-xs text-amber-700 font-medium">Approval tertunda &gt;5 hari</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <p className="font-display font-bold text-navy text-sm mb-4">Timeline Rekrutmen</p>
        <div className="space-y-0">
          {buildTimeline(timeline, sla).map((t, i, arr) => (
            <TimelineItem key={i} label={t.label} date={t.date} isLast={i === arr.length - 1} color={t.color} />
          ))}
        </div>
      </div>

      {/* ✅ BARU: Card supervisory untuk Atasan */}
      {isAtasan && !isCompleted && isEditable && (
        <div className="card border-l-4 border-l-amber-400" style={{ background: '#FFFBEB' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,143,0,0.15)' }}>
              <BellRing size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-800">
                Tindakan Diperlukan dari Bawahan
              </p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                HRD telah membuka izin edit tanggal untuk permintaan ini.
                Ingatkan <strong>{sla?.nama_peminta}</strong> untuk segera membuka
                aplikasi dan memperbarui tanggal target rekrutmen.
              </p>
              <div className="mt-2 bg-amber-100 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-800 font-medium">
                  💡 Hubungi {sla?.nama_peminta} melalui pesan atau telepon agar update segera dilakukan sebelum batas waktu berakhir.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HRD-only: Hired candidates */}
      {isHrd && hiredData.length > 0 && (
        <div className="card">
          <p className="font-display font-bold text-navy text-sm mb-3">Kandidat Diterima</p>
          <div className="space-y-2">
            {hiredData.map(c => (
              <div key={c.rkt_nomor} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <User size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{c.nama}</p>
                    <p className="text-xs text-slate-400 font-mono">{c.rkt_nomor}</p>
                  </div>
                </div>
                <button
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40"
                  disabled={c.is_grouped}
                  onClick={() => { setSelectedRkt(c); setShowNoShow(true) }}
                >
                  Batalkan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HRD-only actions */}
      {isHrd && !isCompleted && sla?.sla_status === 'CALCULATED' && (
        <div className="space-y-3">
          <div className={`card border-l-4 ${isEditable ? 'border-l-orange-400' : 'border-l-slate-300'}`}>
            <div className="flex items-start gap-3 mb-3">
              {isEditable ? <LockOpen size={18} className="text-orange-500 shrink-0" /> : <Lock size={18} className="text-slate-400 shrink-0" />}
              <div>
                <p className={`font-semibold text-sm ${isEditable ? 'text-orange-600' : 'text-navy'}`}>
                  {isEditable ? 'Izin Edit: Terbuka' : 'Izin Edit Tanggal'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEditable ? 'Peminta sedang dapat mengubah tanggal target' : 'Buka izin agar peminta dapat mengubah tanggal'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEditable(true)}
              className={`w-full text-sm font-semibold py-2 rounded-xl transition-colors ${
                isEditable ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-white hover:bg-slate-800'
              }`}
            >
              {isEditable ? 'Tutup Izin Edit' : 'Buka Izin Edit untuk Peminta'}
            </button>
          </div>

          <div className="card border-l-4 border-l-green-500">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-700">Tutup Permintaan Manual</p>
                <p className="text-xs text-slate-400 mt-0.5">Akhiri SLA jika rekrutmen sudah selesai</p>
              </div>
            </div>
            <button onClick={() => setShowComplete(true)} className="w-full text-sm font-semibold py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors">
              Tutup Manual
            </button>
          </div>
        </div>
      )}

      {/* Edit History */}
      {history.length > 0 && (
        <div className="card">
          <button className="w-full flex items-center justify-between font-display font-bold text-navy text-sm" onClick={() => setHistoryOpen(h => !h)}>
            Riwayat Perubahan ({history.length})
            {historyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {historyOpen && (
            <div className="mt-4 space-y-3">
              {history.map(h => <HistoryItem key={h.log_id} item={h} />)}
            </div>
          )}
        </div>
      )}

      {sla?.sla_notes && (
        <div className="card flex gap-3">
          <Info size={16} className="text-sapphire shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-navy mb-1">Catatan</p>
            <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">{sla.sla_notes}</p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showNoShow && selectedRkt && (
        <NoShowDialog
          candidate={selectedRkt}
          loading={cancelMut.isPending}
          onConfirm={(bufferDays, keterangan) => cancelMut.mutate({ rktNomor: selectedRkt.rkt_nomor, bufferDays, keterangan })}
          onClose={() => setShowNoShow(false)}
        />
      )}
      {showEditable && (
        <EditableDialog
          isCurrentlyEditable={isEditable}
          loading={editableMut.isPending}
          onConfirm={(keterangan) => editableMut.mutate({ isEditable: 1, keterangan })}
          onClose2={() => editableMut.mutate({ isEditable: 0, keterangan: 'Izin edit ditutup' })}
          onClose={() => setShowEditable(false)}
        />
      )}
      {showComplete && (
        <SimpleConfirmDialog
          title="Tutup Permintaan?"
          message="Tindakan ini akan menghentikan perhitungan SLA dan menandai rekrutmen Selesai (COMPLETED)."
          confirmLabel="Ya, Tutup"
          confirmColor="bg-green-600 hover:bg-green-700"
          loading={completeMut.isPending}
          onConfirm={() => completeMut.mutate()}
          onClose={() => setShowComplete(false)}
        />
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function buildTimeline(timeline, sla) {
  if (!timeline) return []
  const items = []
  if (timeline.request_created_at)
    items.push({ label: 'Permintaan Dibuat', date: timeline.request_created_at, color: '#2E7D32' })
  if (timeline.approved_at)
    items.push({ label: 'Disetujui Atasan',  date: timeline.approved_at,        color: '#2E7D32' })
  if (timeline.original_target_date && timeline.original_target_date !== timeline.final_target_date)
    items.push({ label: 'Tanggal Butuh Awal (User)', date: timeline.original_target_date, color: '#0F52BA' })
  if (timeline.system_floor_date && timeline.system_floor_date !== timeline.final_target_date && sla?.sla_source === 'SYSTEM')
    items.push({ label: 'Estimasi Minimum Sistem', date: timeline.system_floor_date, color: '#475569' })

  const finalLabel = sla?.sla_source === 'USER'
    ? 'Target Disepakati (Sesuai Permintaan)'
    : sla?.sla_source === 'SYSTEM'
      ? 'Target Disepakati (Sesuai Sistem)'
      : 'Target Final'
  items.push({ label: finalLabel, date: timeline.final_target_date, color: '#0F52BA' })

  if (timeline.max_target_date && timeline.max_target_date !== timeline.final_target_date)
    items.push({ label: 'Batas Maksimal', date: timeline.max_target_date, color: '#F57C00' })
  return items
}

function TimelineItem({ label, date, isLast, color }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full border-2 mt-1 bg-white" style={{ borderColor: color }} />
        {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
      </div>
      <div className={`${isLast ? '' : 'pb-5'}`}>
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-slate-400">{formatDate(date)}</p>
      </div>
    </div>
  )
}

function StatusRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-semibold" style={{ color: valueColor || '#000926' }}>{value || '–'}</span>
    </div>
  )
}

function Chip({ label }) {
  return <span className="text-xs font-semibold px-3 py-1 bg-white/20 rounded-full text-white">{label}</span>
}

function HistoryItem({ item }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
        <Edit3 size={13} className="text-sapphire" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-navy">{item.user_nama || item.user_kode}</p>
        <p className="text-xs text-slate-400">{formatDate(item.created_at)}</p>
        <div className="mt-1 bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-600">
            {item.field_name === 'no_show_buffer'
              ? `No-show buffer: ${item.new_value}`
              : `${item.field_name}: ${item.old_value || '–'} → ${item.new_value || '–'}`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Dialogs — semua dengan backdrop click & createPortal ──────────────────────

function NoShowDialog({ candidate, loading, onConfirm, onClose }) {
  const [days, setDays] = useState('')
  const [ket, setKet]   = useState('')
  const daysNum = parseInt(days)
  const valid   = !isNaN(daysNum) && daysNum >= 1 && daysNum <= 30 && ket.trim().length >= 5

  return (
    <DialogWrapper title="Batalkan Kandidat?" onClose={onClose}>
      <p className="text-sm font-semibold text-navy mb-1">{candidate.nama}</p>
      <p className="text-xs text-slate-400 mb-4">Buffer hari ini dikurangi dari gross duration saat menghitung KPI bersih HRD.</p>
      <div className="space-y-3">
        <div>
          <label className="label">Tambah berapa hari buffer? (1–30)</label>
          <input className="input" type="number" min={1} max={30} value={days}
            onChange={e => setDays(e.target.value)} placeholder="Contoh: 3" />
        </div>
        <div>
          <label className="label">Keterangan</label>
          <textarea className="input resize-none" rows={3} value={ket}
            onChange={e => setKet(e.target.value)} placeholder="Contoh: Kandidat tidak hadir 24 Feb" />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Batal</button>
        <button
          className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          disabled={!valid || loading}
          onClick={() => onConfirm(daysNum, ket)}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Memproses...' : 'Batalkan & Catat'}
        </button>
      </div>
    </DialogWrapper>
  )
}

function EditableDialog({ isCurrentlyEditable, loading, onConfirm, onClose2, onClose }) {
  const [ket, setKet] = useState('')

  if (isCurrentlyEditable) {
    return (
      <DialogWrapper title="Tutup Izin Edit?" onClose={onClose}>
        <p className="text-sm text-slate-600 mb-4">Izin edit akan ditutup. Peminta tidak dapat lagi mengubah tanggal target.</p>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Batal</button>
          <button
            className="flex-1 py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
            onClick={onClose2}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Tutup Izin
          </button>
        </div>
      </DialogWrapper>
    )
  }

  return (
    <DialogWrapper title="Buka Izin Edit Tanggal" onClose={onClose}>
      <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mb-3">Peminta akan dapat mengubah tanggal kebutuhan. SLA akan dihitung ulang setelah disimpan.</p>
      <label className="label">Alasan / Instruksi untuk Peminta</label>
      <textarea className="input resize-none" rows={3} value={ket}
        onChange={e => setKet(e.target.value)}
        placeholder="Contoh: Kandidat tidak hadir, mohon perbarui tanggal target" />
      <div className="flex gap-3 mt-4">
        <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Batal</button>
        <button
          className="flex-1 py-2 rounded-xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={ket.trim().length < 5 || loading}
          onClick={() => onConfirm(ket)}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Buka Izin
        </button>
      </div>
    </DialogWrapper>
  )
}

function SimpleConfirmDialog({ title, message, confirmLabel, confirmColor, loading, onConfirm, onClose }) {
  return (
    <DialogWrapper title={title} onClose={onClose}>
      <p className="text-sm text-slate-600 mb-4">{message}</p>
      <div className="flex gap-3">
        <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Batal</button>
        <button
          className={`flex-1 py-2 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors ${confirmColor}`}
          disabled={loading}
          onClick={onConfirm}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Memproses...' : confirmLabel}
        </button>
      </div>
    </DialogWrapper>
  )
}

/**
 * FIX #4: DialogWrapper menggunakan createPortal agar posisi fixed
 * selalu relatif ke viewport, bukan ke parent yang di-scroll.
 * Sebelumnya dialog muncul mengikuti scroll posisi halaman.
 */
function DialogWrapper({ title, onClose, children }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
        <h3 className="font-display font-bold text-navy text-lg mb-4">{title}</h3>
        {children}
      </div>
    </div>,
    document.body
  )
}