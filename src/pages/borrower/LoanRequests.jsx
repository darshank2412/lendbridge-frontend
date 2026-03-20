import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getMyLoanRequests, cancelLoanRequest, getEmiSchedule } from '../../api/services'
import {
  SectionHeader, StatusBadge, Modal, Table, PageLoader, EmptyState, Alert
} from '../../components/ui'
import { formatINR, formatDate, generateAmortization } from '../../utils/emi'
import { Link } from 'react-router-dom'

function EmiScheduleModal({ open, onClose, request }) {
  const schedule = request
    ? generateAmortization(request.amount, 12, request.tenureMonths) // 12% fallback until API returns rate
    : []

  return (
    <Modal open={open} onClose={onClose} title="EMI Repayment Schedule" size="xl">
      {request && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-ink-800/50 rounded-xl p-3">
              <p className="text-xs text-ink-400">Loan Amount</p>
              <p className="text-lg font-display font-semibold text-ink-100">{formatINR(request.amount)}</p>
            </div>
            <div className="bg-ink-800/50 rounded-xl p-3">
              <p className="text-xs text-ink-400">Tenure</p>
              <p className="text-lg font-display font-semibold text-ink-100">{request.tenureMonths} months</p>
            </div>
            <div className="bg-ink-800/50 rounded-xl p-3">
              <p className="text-xs text-ink-400">Status</p>
              <div className="mt-1"><StatusBadge status={request.status} /></div>
            </div>
          </div>
          <div className="table-wrap max-h-80 overflow-y-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>EMI #</th><th>Due Date</th><th>Principal</th>
                  <th>Interest</th><th>EMI</th><th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(row => (
                  <tr key={row.emiNumber}>
                    <td className="font-mono text-xs">{row.emiNumber}</td>
                    <td>{formatDate(row.dueDate)}</td>
                    <td>{formatINR(row.principal)}</td>
                    <td className="text-ruby-400">{formatINR(row.interest)}</td>
                    <td className="font-medium text-gold-400">{formatINR(row.emi)}</td>
                    <td>{formatINR(row.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-500 mt-3">* Exact rate applied on disbursement</p>
        </div>
      )}
    </Modal>
  )
}

export default function BorrowerLoanRequests() {
  const { getUserId } = useAuthStore()
  const qc = useQueryClient()
  const userId = getUserId()
  const [selectedReq, setSelectedReq] = useState(null)
  const [emiModal, setEmiModal] = useState(null)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-loan-requests', userId],
    queryFn: () => getMyLoanRequests(userId),
    enabled: !!userId,
  })

  const cancelMutation = useMutation({
    mutationFn: ({ requestId }) => cancelLoanRequest(requestId, userId),
    onSuccess: () => {
      qc.invalidateQueries(['my-loan-requests'])
      setSelectedReq(null)
    },
    onError: (err) => setError(err.response?.data?.message || 'Cancel failed'),
  })

  const requests = data?.data?.data || []

  const columns = [
    { key: 'id', label: '#', render: v => <span className="font-mono text-xs text-ink-400">#{v}</span> },
    { key: 'loanProductName', label: 'Product' },
    { key: 'amount', label: 'Amount', render: v => formatINR(v) },
    { key: 'tenureMonths', label: 'Tenure', render: v => `${v}m` },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'createdAt', label: 'Applied', render: v => formatDate(v) },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'DISBURSED' && (
            <button onClick={() => setEmiModal(row)} className="text-xs text-gold-400 hover:underline">
              EMI Schedule
            </button>
          )}
          {row.status === 'PENDING' && (
            <button
              onClick={() => {
                if (confirm('Cancel this loan request?')) cancelMutation.mutate({ requestId: row.id })
              }}
              className="text-xs text-ruby-400 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="My Loan Requests"
        subtitle="Track and manage your loan applications"
        action={
          <Link to="/borrower/new-request" className="btn-primary text-sm">+ New Request</Link>
        }
      />

      <Alert type="error" message={error} />
      {error && <div className="mb-4" />}

      <div className="card overflow-hidden">
        <Table
          columns={columns}
          data={requests}
          loading={isLoading}
          emptyState={
            <EmptyState
              icon="📋"
              title="No loan requests"
              description="Apply for your first loan to get started"
              action={<Link to="/borrower/new-request" className="btn-primary">Apply Now</Link>}
            />
          }
        />
      </div>

      <EmiScheduleModal open={!!emiModal} onClose={() => setEmiModal(null)} request={emiModal} />
    </div>
  )
}
