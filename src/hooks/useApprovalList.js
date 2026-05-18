// src/hooks/useApprovalList.js
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { approvalApi, recruitmentApi } from '../api/services'
import { sanitizeApiError } from '../utils/security'
import logger from '../utils/logger'
import toast from 'react-hot-toast'

export function useApprovalList(viewMode = 'ATASAN') {
  const { isHrd } = useAuth()
  const qc = useQueryClient()

  const [confirmItem, setConfirmItem]         = useState(null)
  const [isHrdDialogItem, setIsHrdDialogItem] = useState(null)
  const [isHrdRejectItem, setIsHrdRejectItem] = useState(null)
  const [slaResultInfo, setSlaResultInfo]     = useState(null)

  // ✅ PERUBAHAN 1: Hapus `enabled: viewMode === 'ATASAN'` agar data Atasan selalu diambil
  const atasanQ = useQuery({
    queryKey: ['approval-atasan'],
    queryFn: () => approvalApi.listAtasan(undefined).then(r => r.data.data ?? []),
  })

  // ✅ PERUBAHAN 2: Ubah enabled hanya mengecek apakah user adalah HRD
  const hrdQ = useQuery({
    queryKey: ['approval-hrd'],
    queryFn: () => approvalApi.listHrd(undefined).then(r => r.data.data ?? []),
    enabled: !!isHrd, 
  })

  const refetch = async () => {
    await recruitmentApi.syncManual()
    // Refresh keduanya sekaligus agar notifikasi akurat
    atasanQ.refetch()
    if (isHrd) hrdQ.refetch()
  }

  const atasanMut = useMutation({
    mutationFn: ({ tpk_nomor, action }) =>
      approvalApi.actionAtasan({ tpk_nomor, action }),
    onSuccess: (_, variables) => {
      if (variables.action === 'APPROVE') {
        toast.success('Permintaan disetujui! Menunggu persetujuan HRD.')
      } else {
        toast.success('Permintaan berhasil ditolak.')
      }
      qc.invalidateQueries({ queryKey: ['approval-atasan'] })
      // Jika disetujui atasan, antrian HRD mungkin bertambah, refresh query HRD
      if (isHrd && variables.action === 'APPROVE') qc.invalidateQueries({ queryKey: ['approval-hrd'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setConfirmItem(null)
    },
    onError: (e) => {
      logger.warn('[useApprovalList] atasanMut error:', e)
      toast.error(sanitizeApiError(e, 'Gagal memproses persetujuan.'))
    },
  })

  const hrdApproveMut = useMutation({
    mutationFn: ({ tpk_nomor }) =>
      approvalApi.actionHrd({ tpk_nomor, action: 'APPROVE' }),
    onSuccess: (data) => {
      const slaInfo = data?.data?.data?.sla_info
      if (slaInfo) {
        setSlaResultInfo(slaInfo)
      } else {
        toast.success('Permintaan disetujui! Rekrutmen dibuka.')
      }
      qc.invalidateQueries({ queryKey: ['approval-hrd'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setIsHrdDialogItem(null)
    },
    onError: (e) => {
      logger.warn('[useApprovalList] hrdApproveMut error:', e)
      toast.error(sanitizeApiError(e, 'Gagal memproses persetujuan HRD.'))
    },
  })

  const hrdRejectMut = useMutation({
    mutationFn: ({ tpk_nomor, alasan_tolak }) =>
      approvalApi.actionHrd({ tpk_nomor, action: 'REJECT', alasan_tolak }),
    onSuccess: () => {
      toast.success('Permintaan ditolak oleh HRD.')
      qc.invalidateQueries({ queryKey: ['approval-hrd'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setIsHrdRejectItem(null)
    },
    onError: (e) => {
      logger.warn('[useApprovalList] hrdRejectMut error:', e)
      toast.error(sanitizeApiError(e, 'Gagal memproses penolakan.'))
    },
  })

  const list    = viewMode === 'HRD' ? (hrdQ.data ?? [])  : (atasanQ.data ?? [])
  const loading = viewMode === 'HRD' ? hrdQ.isLoading      : atasanQ.isLoading
  const error   = viewMode === 'HRD' ? hrdQ.error          : atasanQ.error

  const isPending = (item) => viewMode === 'HRD'
    ? item.tpk_approveHRD === 0
    : item.tpk_approveatasan === 0

  // ✅ PERUBAHAN 3: Hitung jumlah pending (belum approve) untuk masing-masing role
  const pendingAtasanCount = (atasanQ.data ?? []).filter(item => Number(item.tpk_approveatasan) === 0 && Number(item.is_legacy) !== 1).length
  const pendingHrdCount    = (hrdQ.data ?? []).filter(item => Number(item.tpk_approveHRD) === 0 && Number(item.is_legacy) !== 1).length

  return {
    list, loading, error,
    refetch,
    isHrd,
    confirmItem, setConfirmItem,
    isHrdDialogItem, setIsHrdDialogItem,
    isHrdRejectItem, setIsHrdRejectItem,
    slaResultInfo, setSlaResultInfo,
    atasanMut,
    hrdApproveMut,
    hrdRejectMut,
    isPending,
    // Ekspor perhitungan ke komponen UI
    pendingAtasanCount,
    pendingHrdCount
  }
}