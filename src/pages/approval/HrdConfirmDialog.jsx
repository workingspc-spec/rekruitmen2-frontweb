// src/pages/approval/HrdConfirmDialog.jsx
// Dialog konfirmasi APPROVE oleh HRD (tidak berubah dari sebelumnya kecuali pesan)
import { createPortal } from 'react-dom'
import { formatDate } from '../../utils/helpers'
import { Spinner } from '../../components/ui'
import { CheckCircle2, AlertTriangle, Flag, Building2, Users, Calendar, CheckSquare } from 'lucide-react'
import { DetailRow } from './ApprovalCard'

export function HrdConfirmDialog({ item, loading, onConfirm, onClose, errorMessage }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={24} className="text-amber-500 shrink-0" />
          <div>
            <h3 className="font-display font-bold text-navy text-lg">Setujui & Buka Rekrutmen?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Setelah disetujui, rekrutmen akan dibuka dan <strong>penghitungan SLA dimulai</strong>.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-5">
          <DetailRow icon={<Flag size={14} />}        label="Nomor"     value={item.tpk_nomor} mono />
          <DetailRow icon={<CheckSquare size={14} />} label="Jabatan"   value={item.jab_nama} />
          <DetailRow icon={<Building2 size={14} />}   label="Bagian"    value={item.tpk_bagian} />
          <DetailRow icon={<Users size={14} />}       label="Jumlah"    value={`${item.tpk_jumlah} orang`} />
          <DetailRow icon={<Calendar size={14} />}    label="Tgl Butuh" value={formatDate(item.tpk_tgl_butuh)} />
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">{errorMessage}</p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button
            className="btn-primary flex-1 justify-center bg-green-600 hover:bg-green-700"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size={16} /> : <CheckCircle2 size={16} />}
            {loading ? 'Memproses...' : 'Ya, Setujui & Mulai SLA'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}