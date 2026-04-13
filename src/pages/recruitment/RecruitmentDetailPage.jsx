// src/pages/recruitment/RecruitmentDetailPage.jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { recruitmentApi } from '../../api/services'
import { formatDate, getSlaStatusMeta, getSlaSourceMeta } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'
import {
  Edit2, Loader2, Flag, User, Building2, Calendar, Users,
  FileText, CheckCircle2, XCircle, Clock, Info,
  ChevronDown, ChevronUp, History, ArrowRight,
} from 'lucide-react'

export default function RecruitmentDetailPage() {
  const { nomor }       = useParams()
  const navigate        = useNavigate()
  const { user, isHrd } = useAuth()

  const [showSlaTooltip, setShowSlaTooltip] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recruitment-detail', nomor],
    queryFn: () => recruitmentApi.detail(nomor).then(r => r.data.data),
  })

  const { data: logData = [] } = useQuery({
    queryKey: ['recruitment-log', nomor],
    queryFn: () => recruitmentApi.log(nomor).then(r => r.data.data ?? []),
    enabled: Boolean(nomor),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-sapphire" />
    </div>
  )

  if (isError || !data) return (
    <div className="text-center py-16 text-slate-400">
      <p>Gagal memuat data.</p>
      <button className="btn-secondary mt-3" onClick={refetch}>Coba Lagi</button>
    </div>
  )

  const isDraft = data.tpk_approveatasan === 0 && data.tpk_approveHRD === 0
  const isOwner = data.tpk_peminta?.trim() === user?.kode
  const canEdit = !isHrd && isOwner && (isDraft || data.sla_is_editable === 1)

  const keterangans = [1,2,3,4,5,6,7,8,9,10]
    .map(i => data[`tpk_keterangan${i === 1 ? '' : i}`])
    .filter(Boolean)

  const specs = [1,2,3,4,5,6,7,8,9,10]
    .map(i => data[`tpk_spesifikasi${i === 1 ? '' : i}`])
    .filter(Boolean)

  const approvalStatus = () => {
    if (data.tpk_approveatasan === 2 || data.tpk_approveHRD === 2)
      return { label: 'Ditolak',                   color: 'text-red-600',    bg: 'bg-red-50 border-red-200' }
    if (data.tpk_approveatasan === 0)
      return { label: 'Menunggu Approval Atasan',   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' }
    if (data.tpk_approveHRD === 0)
      return { label: 'Menunggu Approval HRD',      color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' }
    return   { label: 'Disetujui Lengkap',          color: 'text-green-700',  bg: 'bg-green-50 border-green-200' }
  }

  const status = approvalStatus()

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Detail Permintaan</h1>
          <p className="font-mono text-xs text-slate-400 mt-0.5">{nomor}</p>
        </div>
        {canEdit && (
          <button
            className="btn-primary"
            onClick={() => navigate(`/recruitment/edit/${encodeURIComponent(nomor)}`)}
          >
            <Edit2 size={16} /> Edit
          </button>
        )}
      </div>

      {/* Status Banner */}
      <div className={`flex items-center gap-3 border rounded-2xl p-4 ${status.bg}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${status.color.replace('text','bg')}`} />
        <span className={`font-semibold text-sm ${status.color}`}>{status.label}</span>
      </div>

      {/* Main Info */}
      <div className="card">
        <div className="mb-4">
          <h2 className="font-display font-bold text-xl text-navy">{data.jab_nama}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{data.tpk_bagian}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InfoItem icon={<User size={15} />}      label="Peminta"        value={data.tpk_peminta} />
          <InfoItem icon={<Users size={15} />}     label="Jumlah"         value={`${data.tpk_jumlah} orang`} />
          <InfoItem icon={<Calendar size={15} />}  label="Tgl Permintaan" value={formatDate(data.tpk_tanggal)} />
          <InfoItem icon={<Calendar size={15} />}  label="Tgl Butuh"      value={formatDate(data.tpk_tgl_butuh)} />
          <InfoItem icon={<Building2 size={15} />} label="Jabatan Kode"   value={data.jab_kode || data.tpk_jab_kode} />
        </div>
      </div>

      {/* SLA Info */}
      {data.sla_final_target_date && data.sla_status !== 'PENDING' && (
        <div className={`card border-l-4 ${
          data.sla_source === 'SYSTEM' ? 'border-l-amber-400' :
          data.sla_source === 'USER'   ? 'border-l-green-500' : 'border-l-blue-400'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Flag size={16} className="text-sapphire" />
            <h3 className="font-display font-bold text-navy text-sm">Informasi SLA Target</h3>
          </div>
          <div className="space-y-2">
            {data.sla_original_requested_date && (
              <SlaRow label="Tanggal Butuh User" value={formatDate(data.sla_original_requested_date)} />
            )}
            {data.sla_system_floor_date && data.sla_source === 'SYSTEM' && (
              <SlaRow label="Estimasi Minimum Sistem" value={formatDate(data.sla_system_floor_date)} />
            )}
            <SlaRow label="Target Final HRD" value={formatDate(data.sla_final_target_date)} bold />
            {data.sla_min_days && (
              <SlaRow label="Lead Time Minimum" value={`${data.sla_min_days} hari kerja`} />
            )}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              {(() => {
                const meta = getSlaSourceMeta(data.sla_source)
                return (
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: meta.bg, color: meta.text }}
                  >
                    {meta.label}
                  </span>
                )
              })()}
              {data.sla_is_editable === 1 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                  Perlu Update Tanggal
                </span>
              )}
              {data.sla_source === 'SYSTEM' && (
                <button
                  onClick={() => setShowSlaTooltip(true)}
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                  title="Info penyesuaian tanggal"
                >
                  <Info size={14} />
                  Info
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alasan */}
      {data.tpk_alasan && (
        <div className="card">
          <h3 className="font-display font-bold text-navy text-sm mb-3 flex items-center gap-2">
            <FileText size={15} /> Alasan Permintaan
          </h3>
          <p className="text-sm text-slate-700 font-semibold">{data.tpk_alasan}</p>
          {data.tpk_alasanlain && (
            <p className="text-sm text-slate-600 mt-1">{data.tpk_alasanlain}</p>
          )}
        </div>
      )}

      {/* Keterangan */}
      {keterangans.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-navy text-sm mb-3">Keterangan Pekerjaan</h3>
          <ol className="space-y-2">
            {keterangans.map((k, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-sapphire font-bold w-5 shrink-0">{i + 1}.</span>
                <span className="text-slate-700">{k}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Spesifikasi */}
      {specs.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-navy text-sm mb-3">Spesifikasi yang Dibutuhkan</h3>
          <ul className="space-y-2">
            {specs.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Approval Status */}
      <div className="card">
        <h3 className="font-display font-bold text-navy text-sm mb-4">Status Approval</h3>
        <div className="space-y-4">
          <ApprovalItem
            title="Approval Atasan"
            status={data.tpk_approveatasan}
            date={data.tpk_tgl_approveatasan}
          />
          <div className="border-t border-slate-100" />
          <ApprovalItem
            title="Approval HRD"
            status={data.tpk_approveHRD}
            date={data.tpk_tgl_approveHRD}
          />
        </div>
      </div>

      {/* Log History */}
      {logData.length > 0 && (
        <div className="card">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setLogOpen(o => !o)}
          >
            <div className="flex items-center gap-2">
              <History size={15} className="text-sapphire" />
              <span className="font-display font-bold text-navy text-sm">
                Log Perubahan ({logData.length})
              </span>
            </div>
            {logOpen
              ? <ChevronUp size={16} className="text-slate-400" />
              : <ChevronDown size={16} className="text-slate-400" />
            }
          </button>

          {logOpen && (
            <div className="mt-4 space-y-3">
              {logData.map(entry => (
                <LogEntry key={entry.log_id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ Dialog Tooltip SLA dengan BACKDROP CLICK */}
      {showSlaTooltip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowSlaTooltip(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Info size={20} className="text-amber-600" />
              </div>
              <h3 className="font-display font-bold text-navy text-lg">Informasi Penyesuaian</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tanggal kebutuhan telah disesuaikan otomatis untuk memastikan ketersediaan waktu
              proses yang cukup sejak persetujuan terakhir. Penyesuaian ini dilakukan oleh
              sistem mengikuti standar lead time rekrutmen yang berlaku.
            </p>
            <button
              onClick={() => setShowSlaTooltip(false)}
              className="btn-primary w-full justify-center"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Log Entry Component ────────────────────────────────────────────────────────
function LogEntry({ entry }) {
  const displayName = entry.user_nama || entry.user_kode || '–'

  const fieldLabel = (name) => {
    const map = {
      tpk_tgl_butuh:    'Tanggal Butuh',
      tpk_jumlah:       'Jumlah',
      tpk_bagian:       'Bagian',
      tpk_alasan:       'Alasan',
      tpk_keterangan:   'Keterangan 1',
      tpk_keterangan2:  'Keterangan 2',
      tpk_keterangan3:  'Keterangan 3',
      tpk_spesifikasi:  'Spesifikasi 1',
      tpk_spesifikasi2: 'Spesifikasi 2',
      tpk_spesifikasi3: 'Spesifikasi 3',
    }
    return map[name] ?? name?.replace(/_/g, ' ') ?? '–'
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-sapphire/10 flex items-center justify-center shrink-0">
        <History size={13} className="text-sapphire" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-navy">{displayName}</span>
          <span className="text-xs text-slate-400">{formatDate(entry.created_at)}</span>
        </div>
        <div className="mt-1.5 bg-slate-50 rounded-xl px-3 py-2">
          <p className="text-xs font-semibold text-slate-500 mb-1">
            {fieldLabel(entry.field_name)}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 line-through">
              {entry.old_value || '(kosong)'}
            </span>
            <ArrowRight size={12} className="text-slate-300 shrink-0" />
            <span className="text-xs font-semibold text-navy">
              {entry.new_value || '(kosong)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helper Components ─────────────────────────────────────────────────────────

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-navy">{value || '–'}</p>
      </div>
    </div>
  )
}

function SlaRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? 'font-bold text-sapphire' : 'text-slate-700'}>{value}</span>
    </div>
  )
}

function ApprovalItem({ title, status, date }) {
  const meta = {
    0: { label: 'Menunggu',  icon: <Clock size={16} />,        color: 'text-amber-500' },
    1: { label: 'Disetujui', icon: <CheckCircle2 size={16} />, color: 'text-green-600' },
    2: { label: 'Ditolak',   icon: <XCircle size={16} />,      color: 'text-red-500' },
  }[status] ?? { label: 'Unknown', icon: null, color: 'text-slate-400' }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-slate-700">{title}</span>
      <div className="flex items-center gap-1.5">
        <span className={meta.color}>{meta.icon}</span>
        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
        {status === 1 && date && (
          <span className="text-xs text-slate-400 ml-1">{formatDate(date)}</span>
        )}
      </div>
    </div>
  )
}