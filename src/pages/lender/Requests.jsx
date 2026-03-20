import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import {
  getOpenRequests, getMatchingRequests, getMatchedRequests, acceptLoanRequest
} from '../../api/services'
import { SectionHeader, StatusBadge, Table, PageLoader, EmptyState, Modal, Alert } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'

function LoanRequestTable({ data, loading, onAccept, showAccept }) {
  const columns = [
    { key: 'id', label: '#', render: v => <span className="font-mono text-xs text-ink-400">#{v}</span> },
    { key: 'borrowerName', label: 'Borrower' },
    { key: 'loanProductName', label: 'Product' },
    { key: 'amount', label: 'Amount', render: v => <span className="text-gold-400 font-medium">{formatINR(v)}</span> },
    { key: 'tenureMonths', label: 'Tenure', render: v => `${v}m` },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'createdAt', label: 'Date', render: v => formatDate(v) },
    ...(showAccept ? [{
      key: 'id', label: 'Action',
      render: (_, row) => row.status === 'MATCHED' ? (
        <button onClick={() => onAccept(row)} className="btn-success text-xs px-3 py-1.5">
          Accept
        </button>
      ) : null
    }] : []),
  ]

  return (
    <div className="card overflow-hidden">
      <Table
        columns={columns}
        data={data}
        loading={loading}
        emptyState={<EmptyState icon="📬" title="No requests found" />}
      />
    </div>
  )
}

export function LenderOpenRequests() {
  const { getUserId } = useAuthStore()
  const lenderId = getUserId()
  const { data, isLoading } = useQuery({
    queryKey: ['open-requests', lenderId],
    queryFn: () => getOpenRequests(lenderId),
    enabled: !!lenderId,
  })
  const requests = data?.data?.data || []

  return (
    <div className="animate-fade-up">
      <SectionHeader title="Open Loan Requests" subtitle="All PENDING requests in the market" />
      <LoanRequestTable data={requests} loading={isLoading} showAccept={false} />
    </div>
  )
}

export function LenderMatchingRequests() {
  const { getUserId } = useAuthStore()
  const lenderId = getUserId()
  const { data, isLoading } = useQuery({
    queryKey: ['matching-requests', lenderId],
    queryFn: () => getMatchingRequests(lenderId),
    enabled: !!lenderId,
  })
  const requests = data?.data?.data || []

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="Matching Requests"
        subtitle="Requests that match your set preferences"
      />
      {requests.length > 0 && (
        <div className="mb-4 p-3 bg-gold-500/10 border border-gold-500/20 rounded-xl text-xs text-gold-400">
          ✦ These requests match your lending preferences for amount, rate, and tenure
        </div>
      )}
      <LoanRequestTable data={requests} loading={isLoading} showAccept={false} />
    </div>
  )
}

export function LenderMatchedRequests() {
  const { getUserId } = useAuthStore()
  const lenderId = getUserId()
  const qc = useQueryClient()
  const [confirmReq, setConfirmReq] = useState(null)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['matched-requests'],
    queryFn: getMatchedRequests,
  })

  const acceptMutation = useMutation({
    mutationFn: (requestId) => acceptLoanRequest(requestId, lenderId),
    onSuccess: () => {
      qc.invalidateQueries(['matched-requests'])
      setConfirmReq(null)
    },
    onError: (e) => setError(e.response?.data?.message || 'Accept failed'),
  })

  const requests = data?.data?.data || []

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="Matched Requests"
        subtitle="Admin-matched requests awaiting your acceptance"
      />
      <LoanRequestTable
        data={requests}
        loading={isLoading}
        showAccept
        onAccept={(req) => { setConfirmReq(req); setError('') }}
      />

      <Modal
        open={!!confirmReq}
        onClose={() => setConfirmReq(null)}
        title="Confirm Acceptance"
      >
        {confirmReq && (
          <div className="space-y-4">
            <Alert type="error" message={error} />
            <div className="p-4 bg-ink-800/50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-400">Borrower</span>
                <span className="text-ink-200">{confirmReq.borrowerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Amount</span>
                <span className="text-gold-400 font-semibold">{formatINR(confirmReq.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Tenure</span>
                <span className="text-ink-200">{confirmReq.tenureMonths} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Purpose</span>
                <span className="text-ink-200">{confirmReq.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Product</span>
                <span className="text-ink-200">{confirmReq.loanProductName}</span>
              </div>
            </div>
            <p className="text-xs text-ink-400">
              By accepting, you agree to lend {formatINR(confirmReq.amount)} to this borrower.
              Other offers for this request will be auto-rejected.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmReq(null)}>
                Cancel
              </button>
              <button
                className="btn-success flex-1"
                onClick={() => acceptMutation.mutate(confirmReq.id)}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? 'Accepting...' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
