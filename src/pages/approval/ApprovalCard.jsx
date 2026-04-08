// src/pages/approval/ApprovalCard.jsx
import { formatDate } from '../../utils/helpers'
import { Eye, CheckCircle2, XCircle, Building2, Users, Calendar, Flag, CheckSquare } from 'lucide-react'

export function ApprovalCard({ item, isHrd, pending, onApprove, onReject, onDetail }) {
  const approvedByAtasan = item.tpk_approveatasan === 1
  const approvedByHrd    = item.tpk_approveHRD === 1

  return (
    <div className="card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-navy">{item.jab_nama}</p>
          <p className="font-mono text-xs text-slate-400 mt-0.5">{item.tpk_nomor}</p>
        </div>
        <StatusPill atasan={item.tpk_approveatasan} hrd={item.tpk_approveHRD} isHrd={isHrd} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
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

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button className="btn-ghost text-xs px-3 py-1.5" onClick={onDetail}>
          <Eye size={13} /> Detail
        </button>
        <div className="flex-1" />
        {pending && !isHrd && (
          <button className="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:bg-red-50" onClick={onReject}>
            <XCircle size={13} /> Tolak
          </button>
        )}
        {pending && (
          <button
            className="text-xs px-3 py-1.5 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
            onClick={onApprove}
          >
            <CheckCircle2 size={13} /> Setujui
          </button>
        )}
      </div>
    </div>
  )
}

function StatusPill({ atasan, hrd, isHrd }) {
  if (atasan === 2 || hrd === 2) return <Pill label="Ditolak"        color="bg-red-100 text-red-700" />
  if (isHrd  && hrd === 1)       return <Pill label="Disetujui HRD"  color="bg-green-100 text-green-700" />
  if (isHrd  && hrd === 0)       return <Pill label="Perlu Disetujui" color="bg-amber-100 text-amber-700" />
  if (!isHrd && atasan === 1)    return <Pill label="Sudah Disetujui" color="bg-green-100 text-green-700" />
  return <Pill label="Pending" color="bg-amber-100 text-amber-700" />
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