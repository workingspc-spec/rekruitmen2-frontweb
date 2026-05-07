// src/pages/approval/HrdRejectDialog.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDate } from '../../utils/helpers'
import { Spinner } from '../../components/ui'
import { XCircle, Building2, Users, Calendar, Flag, CheckSquare } from 'lucide-react'
import { DetailRow, getApprovalJabatanLabel } from './ApprovalCard'

/**
 * Dialog penolakan HRD — wajib isi alasan sebelum bisa tolak.
 */
export function HrdRejectDialog({ item, loading, onConfirm, onClose }) {
  const [alasan, setAlasan] = useState('')
  const canSubmit = alasan.trim().length >= 5

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
        <div className="flex items-start gap-3 mb-4">
          <XCircle size={24} className="text-red-500 shrink-0" />
          <div>
            <h3 className="font-display font-bold text-navy text-lg">Tolak Permintaan?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Permintaan akan ditolak dan status berubah menjadi <strong>Ditolak HRD</strong>.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-4">
          <DetailRow icon={<Flag size={14} />}        label="Nomor"     value={item.tpk_nomor} mono />
          <DetailRow icon={<CheckSquare size={14} />} label="Jabatan" value={getApprovalJabatanLabel(item)} />
          <DetailRow icon={<Building2 size={14} />}   label="Bagian"    value={item.tpk_bagian} />
          <DetailRow icon={<Users size={14} />}       label="Jumlah"    value={`${item.tpk_jumlah} orang`} />
          <DetailRow icon={<Calendar size={14} />}    label="Tgl Butuh" value={formatDate(item.tpk_tgl_butuh)} />
        </div>

        <div className="mb-4">
          <label className="label">Alasan Penolakan <span className="text-red-500">*</span></label>
          <textarea
            className="input resize-none"
            rows={3}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Tuliskan alasan penolakan (min. 5 karakter)..."
            disabled={loading}
          />
          {alasan.length > 0 && alasan.trim().length < 5 && (
            <p className="text-xs text-red-500 mt-1">Alasan minimal 5 karakter</p>
          )}
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button
            className="btn-danger flex-1 justify-center"
            onClick={() => onConfirm(alasan.trim())}
            disabled={!canSubmit || loading}
          >
            {loading ? <Spinner size={16} /> : <XCircle size={16} />}
            {loading ? 'Memproses...' : 'Tolak Permintaan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}