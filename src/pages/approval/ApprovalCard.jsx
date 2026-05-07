import { formatDate } from '../../utils/helpers'
import { Eye, CheckCircle2, XCircle, Building2, Users, Calendar, Flag, CheckSquare, Clock } from 'lucide-react'
import { AnimatedIcon } from '../../components/AnimatedIcon'

export function ApprovalCard({ item, isHrd, pending, onApprove, onReject, onDetail, currentUserKode }) {
  const approvedByAtasan = item.tpk_approveatasan === 1 || item.tpk_approveatasan === 9
  const isSelfRequest = currentUserKode && item.tpk_peminta === currentUserKode
  const approvedByHrd    = item.tpk_approveHRD === 1

  return (
    <div className="card group hover:shadow-card-hover hover:border-[#A6C5D7] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-navy group-hover:text-sapphire transition-colors duration-300">{item.jab_nama}</p>
          <p className="font-mono text-xs text-slate-400 mt-0.5">{item.tpk_nomor}</p>
        </div>
        {/* 👇 PERUBAHAN: Lempar nilai isLegacy ke dalam StatusPill */}
        <StatusPill atasan={item.tpk_approveatasan} hrd={item.tpk_approveHRD} isHrd={isHrd} isLegacy={item.is_legacy} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
        <DetailRow icon={<Building2 size={13} />} label="Bagian"    value={item.tpk_bagian} />
        <DetailRow icon={<Users size={13} />}     label="Jumlah"    value={`${item.tpk_jumlah} orang`} />
        <DetailRow icon={<Calendar size={13} />}  label="Tgl Butuh" value={formatDate(item.tpk_tgl_butuh)} />
        {item.peminta && (
          <DetailRow icon={<CheckSquare size={13} />} label="Peminta" value={item.peminta} />
        )}
        {item.sla_final_target_date && (
          <DetailRow icon={<Flag size={13} />} label="Target SLA" value={formatDate(item.sla_final_target_date)} />
        )}
      </div>

      {/* 👇 PERUBAHAN: Menambahkan Banner Read-Only khusus Legacy */}
      {item.is_legacy === 1 && (
        <div className="mb-3 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">📁 Data sistem lama · read-only</span>
        </div>
      )}

      {/* Chip tanggal approval */}
      {(approvedByAtasan || approvedByHrd) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {approvedByAtasan && item.tgl_approve_atasan && (
            <ApprovalChip label="Atasan ✓" date={item.tgl_approve_atasan} />
          )}
          {approvedByHrd && item.tgl_approve_hrd && (
            <ApprovalChip label="HRD ✓" date={item.tgl_approve_hrd} />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={onDetail}>
          <AnimatedIcon variant="scale">
            <Eye size={13} />
          </AnimatedIcon>
          Detail
        </button>
        <div className="flex-1" />

        {/* Tombol Tolak — hanya muncul jika benar-benar pending (bukan legacy) */}
        {pending && !isSelfRequest && (
          <button
            className="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 flex items-center gap-1.5"
            onClick={onReject}
          >
            <AnimatedIcon variant="wiggle">
              <XCircle size={13} />
            </AnimatedIcon>
            Tolak
          </button>
        )}

        {/* Tombol Setujui */}
        {pending && !isSelfRequest && (
          <button
            className="text-xs px-3 py-1.5 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
            onClick={onApprove}
          >
            <AnimatedIcon variant="scale">
              <CheckCircle2 size={13} />
            </AnimatedIcon>
            Setujui
          </button>
        )}

        {/* ✅ Tampilkan label jika HRD mencoba approve permintaannya sendiri */}
        {pending && isSelfRequest && (
          <span className="text-xs text-slate-400 italic px-2">
            Tidak dapat memproses milik sendiri
          </span>
        )}
      </div>
    </div>
  )
}

function ApprovalChip({ label, date }) {
  return (
    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
      <Clock size={11} className="text-green-600 shrink-0" />
      <span className="text-xs font-semibold text-green-700">{label}</span>
      <span className="text-xs text-green-500">({formatDate(date)})</span>
    </div>
  )
}

// 👇 PERUBAHAN: Tangkap `isLegacy` dan berikan prioritas paling atas
function StatusPill({ atasan, hrd, isHrd, isLegacy }) {
  let label = "Pending";
  let color = "bg-amber-100 text-amber-700";

  if (atasan === 2) { 
    label = "Ditolak Atasan"; color = "bg-red-100 text-red-700"; 
  } else if (hrd === 2) { 
    label = "Ditolak HRD"; color = "bg-red-100 text-red-700"; 
  } else if (isHrd && hrd === 1) { 
    label = "Disetujui HRD"; color = "bg-green-100 text-green-700"; 
  } else if (isHrd && hrd === 0) { 
    label = "Perlu Disetujui"; color = "bg-amber-100 text-amber-700"; 
  } else if (!isHrd && (atasan === 1 || atasan === 9)) { 
    label = "Sudah Disetujui"; color = "bg-green-100 text-green-700"; 
  }

  // 👇 JIKA LEGACY: Tambahkan teks (Lama) tapi pertahankan warna status aslinya
  if (isLegacy === 1) {
    return <Pill label={`${label} (Sistem Lama)`} color={`${color} border border-current opacity-80`} />
  }

  return <Pill label={label} color={color} />
}

function Pill({ label, color }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
}

export function DetailRow({ icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs text-slate-400">{label}:</span>
      <span className={`text-xs font-medium text-slate-700 ${mono ? 'font-mono' : ''}`}>{value || '–'}</span>
    </div>
  )
}