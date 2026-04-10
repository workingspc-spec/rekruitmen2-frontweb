// src/hooks/useApprovalList.js
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { approvalApi } from '../api/services'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/helpers'

export function useApprovalList(statusParam) {
  const { user, isHrd } = useAuth()
  const qc = useQueryClient()
  const [confirmItem, setConfirmItem]           = useState(null)
  const [isHrdDialogItem, setIsHrdDialogItem]   = useState(null)
  // FIX: state untuk menampilkan dialog detail SLA setelah approve atasan berhasil
  // Identik Android: setelah approveAsAtasan berhasil & slaInfo.source=SYSTEM,
  // tampil dialog dengan finalTargetDate
  const [slaResultInfo, setSlaResultInfo]       = useState(null)

  const atasanQ = useQuery({
    queryKey: ['approval-atasan', statusParam],
    queryFn: () => approvalApi.listAtasan(statusParam).then(r => r.data.data ?? []),
    enabled: !isHrd,
  })

  const hrdQ = useQuery({
    queryKey: ['approval-hrd', statusParam],
    queryFn: () => approvalApi.listHrd(statusParam).then(r => r.data.data ?? []),
    enabled: isHrd,
  })

  const atasanMut = useMutation({
    mutationFn: ({ tpk_nomor, action }) => approvalApi.actionAtasan({ tpk_nomor, action }),
    onSuccess: (data) => {
      const slaInfo = data?.data?.data?.sla_info
      // FIX: Jika sumber SYSTEM, tampilkan dialog detail SLA (bukan hanya toast)
      // Identik Android: setelah approveAsAtasan berhasil & slaInfo.source=SYSTEM,
      // tampil AlertDialog dengan finalTargetDate
      if (slaInfo?.sla_source === 'SYSTEM' || slaInfo) {
        setSlaResultInfo(slaInfo)
      } else {
        toast.success('Permintaan berhasil diproses!')
      }
      qc.invalidateQueries({ queryKey: ['approval-atasan'] })
      setConfirmItem(null)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
  })

  const hrdMut = useMutation({
    mutationFn: ({ tpk_nomor }) => approvalApi.actionHrd({ tpk_nomor }),
    onSuccess: () => {
      toast.success('Permintaan disetujui! Lowongan dibuka.')
      qc.invalidateQueries({ queryKey: ['approval-hrd'] })
      setIsHrdDialogItem(null)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
  })

  const list      = isHrd ? (hrdQ.data ?? [])  : (atasanQ.data ?? [])
  const loading   = isHrd ? hrdQ.isLoading      : atasanQ.isLoading
  const error     = isHrd ? hrdQ.error          : atasanQ.error
  const refetch   = isHrd ? hrdQ.refetch        : atasanQ.refetch
  const isPending = (item) => isHrd
    ? item.tpk_approveHRD === 0
    : item.tpk_approveatasan === 0

  return {
    list, loading, error, refetch, isHrd,
    confirmItem, setConfirmItem,
    isHrdDialogItem, setIsHrdDialogItem,
    slaResultInfo, setSlaResultInfo,
    atasanMut, hrdMut, isPending,
  }
}