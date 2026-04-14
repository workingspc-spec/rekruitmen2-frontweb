// src/hooks/useApprovalList.js
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { approvalApi } from '../api/services'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/helpers'

export function useApprovalList() {
    const { isHrd } = useAuth()
    const qc = useQueryClient()
    const [confirmItem, setConfirmItem]         = useState(null)
    const [isHrdDialogItem, setIsHrdDialogItem] = useState(null)
    const [slaResultInfo, setSlaResultInfo]     = useState(null)

    // ✅ FIX: Selalu muat semua data tanpa filter status ke backend.
    // Filter status dilakukan client-side di ApprovalListPage agar count badge akurat.
    // Ini identik dengan Android yang memanggil getApprovalListAtasan(filter.value=null)
    // lalu memfilter di UI.
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

    const atasanMut = useMutation({
        mutationFn: ({ tpk_nomor, action }) => approvalApi.actionAtasan({ tpk_nomor, action }),
        onSuccess: (data) => {
            const slaInfo = data?.data?.data?.sla_info
            if (slaInfo) {
                setSlaResultInfo(slaInfo)
            } else {
                toast.success('Permintaan berhasil diproses!')
            }
            qc.invalidateQueries({ queryKey: ['approval-atasan'] })
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
            qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
            setConfirmItem(null)
        },
        onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
    })

    const hrdMut = useMutation({
        mutationFn: ({ tpk_nomor }) => approvalApi.actionHrd({ tpk_nomor }),
        onSuccess: () => {
            toast.success('Permintaan disetujui! Lowongan dibuka.')
            qc.invalidateQueries({ queryKey: ['approval-hrd'] })
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
            qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
            setIsHrdDialogItem(null)
        },
        onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal memproses.'),
    })

    const list    = isHrd ? (hrdQ.data ?? [])  : (atasanQ.data ?? [])
    const loading = isHrd ? hrdQ.isLoading      : atasanQ.isLoading
    const error   = isHrd ? hrdQ.error          : atasanQ.error
    const refetch = isHrd ? hrdQ.refetch        : atasanQ.refetch

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