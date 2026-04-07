import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { approvalApi } from '../../api/services'
import { formatDate } from '../../utils/helpers'
import { PageLoader, ErrorBox, EmptyState, ConfirmDialog, Spinner } from '../../components/ui'
import { CheckSquare, Eye, CheckCircle2, XCircle, Clock, AlertTriangle, Users, Building2, Calendar, Flag } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'pending',  label: 'Perlu Diproses' },
  { key: 'approved', label: 'Sudah Disetujui' },
  { key: 'all',      label: 'Semua' },
]

export default function ApprovalListPage() {
  const { user, isHrd } = useAuth()
  const navigate         = useNavigate()
  const qc               = useQueryClient()

  const [tab, setTab]           = useState('pending')
  const [confirmItem, setConfirmItem] = useState(null)   // { item, action }
  const [isHrdDialogItem, setIsHrdDialogItem] = useState(null)

  const statusParam = tab === 'all' ? undefined : tab

  // Atasan list
  const atasanQ = useQuery({
    queryKey: ['approval-atasan', statusParam],
    queryFn: () => approvalApi.listAtasan(statusParam).then(r => r.data.data ?? []),
    enabled: !isHrd,
  })
  // HRD list
  const hrdQ = useQuery({
    queryKey: ['approval-hrd', statusParam],
    queryFn: () => approvalApi.listHrd(statusParam).then(r => r.data.data ?? []),
    enabled: isHrd,
  })

  const list    = isHrd ? (hrdQ.data ?? []) : (atasanQ.data ?? [])
  const loading = isHrd ? hrdQ.isLoading : atasanQ.isLoading
  const error   = isHrd ? hrdQ.error : atasanQ.error
  const refetch = isHrd ? hrdQ.refetch : atasanQ.refetch

  // Atasan action mutation
  const atasanMut = useMutation({
    mutationFn: ({ tpk_nomor, action }) => approvalApi.actionAtasan({ tpk_nomor, action }),
    onSuccess: (data) => {
      const slaInfo = data?.data?.data?.sla_info
      if (slaInfo?.sla_source === 'SYSTEM') {
        toast.success(`Disetujui! Target HRD: ${formatDate(slaInfo.final_target_date)} (disesuaikan sistem)`, { duration: 5000 })
      } else {
        toast.success('Permintaan berhasil diproses!')
      }
      qc.invalidateQueries({ queryKey: ['approval-atasan'] })
      setConfirmItem(null)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
  })

  // HRD action mutation
  const hrdMut = useMutation({
    mutationFn: ({ tpk_nomor }) => approvalApi.actionHrd({ tpk_nomor }),
    onSuccess: () => {
      toast.success('Permintaan disetujui! Lowongan dibuka.')
      qc.invalidateQueries({ queryKey: ['approval-hrd'] })
      setIsHrdDialogItem(null)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
  })

  const isPending = (item) => isHrd ? item.tpk_approveHRD === 0 : item.tpk_approveatasan === 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isHrd ? 'Persetujuan HRD' : 'Persetujuan Atasan'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              tab === t.key ? 'bg-white shadow text-sapphire' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? <PageLoader /> :
       error   ? <ErrorBox message="Gagal memuat data approval." onRetry={refetch} /> :
       list.length === 0 ? (
         <EmptyState
           message={tab === 'pending' ? 'Tidak ada permintaan yang perlu diproses.' : 'Tidak ada data.'}
           icon={CheckSquare}
         />
       ) : (
         <div className="space-y-4">
           {list.map(item => (
             <ApprovalCard
               key={item.tpk_nomor}
               item={item}
               isHrd={isHrd}
               pending={isPending(item)}
               onApprove={() => isHrd ? setIsHrdDialogItem(item) : setConfirmItem({ item, action: 'APPROVE' })}
               onReject={() => setConfirmItem({ item, action: 'REJECT' })}
               onDetail={() => navigate(`/recruitment/${encodeURIComponent(item.tpk_nomor)}`)}
             />
           ))}
         </div>
       )
      }

      {/* Atasan confirm dialog */}
      {confirmItem && (
        <ConfirmDialog
          open
          onClose={() => setConfirmItem(null)}
          onConfirm={() => atasanMut.mutate({ tpk_nomor: confirmItem.item.tpk_nomor, action: confirmItem.action })}
          title={confirmItem.action === 'APPROVE' ? 'Setujui Permintaan?' : 'Tolak Permintaan?'}
          message={`${confirmItem.item.jab_nama} — ${confirmItem.item.tpk_bagian}\nJumlah: ${confirmItem.item.tpk_jumlah} orang`}
          confirmText={confirmItem.action === 'APPROVE' ? 'Setujui' : 'Tolak'}
          danger={confirmItem.action === 'REJECT'}
          loading={atasanMut.isPending}
        />
      )}

      {/* HRD confirm dialog */}
      {isHrdDialogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              <div>
                <h3 className="font-display font-bold text-navy text-lg">Setujui & Buka Lowongan?</h3>
                <p className="text-sm text-slate-500 mt-1">Setelah disetujui, lowongan akan dibuka untuk proses shortlist kandidat.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-5">
              <DetailRow icon={<Flag size={14}/>}     label="Nomor"   value={isHrdDialogItem.tpk_nomor} mono />
              <DetailRow icon={<CheckSquare size={14}/>} label="Jabatan" value={isHrdDialogItem.jab_nama} />
              <DetailRow icon={<Building2 size={14}/>} label="Bagian"  value={isHrdDialogItem.tpk_bagian} />
              <DetailRow icon={<Users size={14}/>}    label="Jumlah"  value={`${isHrdDialogItem.tpk_jumlah} orang`} />
              <DetailRow icon={<Calendar size={14}/>} label="Tgl Butuh" value={formatDate(isHrdDialogItem.tpk_tgl_butuh)} />
            </div>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1 justify-center" onClick={() => setIsHrdDialogItem(null)}>Batal</button>
              <button
                className="btn-primary flex-1 justify-center bg-green-600 hover:bg-green-700"
                onClick={() => hrdMut.mutate({ tpk_nomor: isHrdDialogItem.tpk_nomor })}
                disabled={hrdMut.isPending}
              >
                {hrdMut.isPending ? <Spinner size={16} /> : <CheckCircle2 size={16} />}
                {hrdMut.isPending ? 'Memproses...' : 'Ya, Setujui & Buka'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ApprovalCard({ item, isHrd, pending, onApprove, onReject, onDetail }) {
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
        <DetailRow icon={<Building2 size={13}/>} label="Bagian"    value={item.tpk_bagian} />
        <DetailRow icon={<Users size={13}/>}     label="Jumlah"    value={`${item.tpk_jumlah} orang`} />
        <DetailRow icon={<Calendar size={13}/>}  label="Tgl Butuh" value={formatDate(item.tpk_tgl_butuh)} />
        {item.peminta && (
          <DetailRow icon={<CheckSquare size={13}/>} label="Peminta" value={item.peminta} />
        )}
        {item.sla_final_target_date && (
          <DetailRow icon={<Flag size={13}/>} label="Target SLA" value={formatDate(item.sla_final_target_date)} />
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
  if (atasan === 2 || hrd === 2)  return <Pill label="Ditolak"      color="bg-red-100 text-red-700" />
  if (isHrd && hrd === 1)         return <Pill label="Disetujui HRD" color="bg-green-100 text-green-700" />
  if (isHrd && hrd === 0)         return <Pill label="Perlu Disetujui" color="bg-amber-100 text-amber-700" />
  if (!isHrd && atasan === 1)     return <Pill label="Sudah Disetujui" color="bg-green-100 text-green-700" />
  return <Pill label="Pending" color="bg-amber-100 text-amber-700" />
}

function Pill({ label, color }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
}

function DetailRow({ icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs text-slate-400">{label}:</span>
      <span className={`text-xs font-medium text-slate-700 ${mono ? 'font-mono' : ''}`}>{value || '–'}</span>
    </div>
  )
}