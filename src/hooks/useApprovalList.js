// src/hooks/useApprovalList.js
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { approvalApi } from '../api/services'
import toast from 'react-hot-toast'

export function useApprovalList() {
    const { isHrd } = useAuth()
    const qc = useQueryClient()

    const [confirmItem, setConfirmItem]             = useState(null) // { item, action: 'APPROVE'|'REJECT' } — Atasan
    const [isHrdDialogItem, setIsHrdDialogItem]     = useState(null) // HRD Approve confirm
    const [isHrdRejectItem, setIsHrdRejectItem]     = useState(null) // HRD Reject dengan alasan
    const [slaResultInfo, setSlaResultInfo]         = useState(null) // Dialog hasil SLA (dari HRD approve)

    // Selalu muat semua data tanpa filter status — filter dilakukan client-side
    const atasanQ = useQuery({
        queryKey: ['approval-atasan'],
        queryFn: () => approvalApi.listAtasan(undefined).then(r => r.data.data ?? []),
        enabled: !isHrd,
    })

    const hrdQ = useQuery({
        queryKey: ['approval-hrd'],
        queryFn: () => approvalApi.listHrd(undefined).then(r => r.data.data ?? []),
        enabled: isHrd,
    })

    // Mutation Atasan (APPROVE / REJECT) — tidak lagi mengembalikan sla_info
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
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
            qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
            setConfirmItem(null)
        },
        onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
    })

    // Mutation HRD APPROVE — sekarang mengembalikan sla_info seperti atasan dulu
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
        onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
    })

    // Mutation HRD REJECT — dengan alasan
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
        onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
    })

    const list    = isHrd ? (hrdQ.data ?? [])    : (atasanQ.data ?? [])
    const loading = isHrd ? hrdQ.isLoading        : atasanQ.isLoading
    const error   = isHrd ? hrdQ.error            : atasanQ.error
    const refetch = isHrd ? hrdQ.refetch          : atasanQ.refetch

    const isPending = (item) => isHrd
        ? item.tpk_approveHRD === 0
        : item.tpk_approveatasan === 0

    return {
        list, loading, error, refetch, isHrd,
        confirmItem, setConfirmItem,
        isHrdDialogItem, setIsHrdDialogItem,
        isHrdRejectItem, setIsHrdRejectItem,
        slaResultInfo, setSlaResultInfo,
        atasanMut,
        hrdApproveMut,
        hrdRejectMut,
        isPending,
    }
}