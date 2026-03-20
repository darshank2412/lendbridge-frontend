import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllLoanRequests, matchLoanRequest, rejectLoanRequest, disburseLoan
} from '../../api/services'
import { SectionHeader, StatusBadge, Modal, Alert, PageLoader, EmptyState } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'

const STATUSES = ['', 'PENDING', 'MATCHED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'DISBURSED']

function ActionButton({ label, onClick, variant = 'ghost', disabled }) {
  const cls = {
    primary: 'btn-primary text-xs px-3 py-1.5',
    success: 'btn-success text-xs px-3 py-1.5',
    danger: 'btn-danger text-xs px-3 py-1.5',
    ghost: 'btn-ghost text-xs px-3 py-1.5 border border-ink-700',
  }[variant]
  return <button className={cls} onClick={onClick} disabled={disabled}>{label}</button>
}

export default function AdminLoanRequests() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['all-loan-requests', statusFilter],
    queryFn: () => getAllLoanRequests(statusFilter || undefined),
  })

  const matchMutation = useMutation({
    mutationFn: (id) => matchLoanRequest(id),
    onSuccess: () => { qc.invalidateQueries(['all-loan-requests']); setActionLoading(null) },
    onError: (e) => { setError(e.response?.data?.message || 'Failed'); setActionLoading(null) },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectLoanRequest(id, reason),
    onSuccess: () => { qc.invalidateQueries(['all-loan-requests']); setRejectModal(null); setRejectReason('') },
    onError: (e) => setError(e.response?.data?.message || 'Reject failed'),
  })

  const disburseMutation = useMutation({
    mutationFn: (id) => disburseLoan(id),
    onSuccess: () => { qc.invalidateQueries(['all-loan-requests']); setActionLoading(null) },
    onError: (e) => { setError(e.response?.data?.message || 'Disburse failed'); setActionLoading(null) },
  })

  const requests = data?.data?.data || []

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="All Loan Requests"
        subtitle="Match, reject, and disburse loan requests"
        action={
          <select className="select w-40 text-sm"
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
        }
      />

      <Alert type="error" message={error} />
      {error && <div className="mb-4" />}

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {requests.length === 0 ? (
            <EmptyState icon="◩" title="No loan requests" description="No requests match the selected filter" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Borrower</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Tenure</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td className="font-mono text-xs text-ink-400">#{req.id}</td>
                      <td>
                        <p className="text-sm font-medium text-ink-200">{req.borrowerName}</p>
                        <p className="text-xs text-ink-500">ID: {req.borrowerId}</p>
                      </td>
                      <td className="text-sm">{req.loanProductName}</td>
                      <td className="text-gold-400 font-medium">{formatINR(req.amount)}</td>
                      <td>{req.tenureMonths}m</td>
                      <td>
                        <div>
                          <p className="text-sm">{req.purpose}</p>
                          {req.purposeDescription && (
                            <p className="text-xs text-ink-500 truncate max-w-[120px]" title={req.purposeDescription}>
                              {req.purposeDescription}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={req.status} />
                        {req.rejectionReason && (
                          <p className="text-xs text-ruby-400 mt-1 max-w-[100px] truncate" title={req.rejectionReason}>
                            {req.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="text-xs text-ink-400">{formatDate(req.createdAt)}</td>
                      <td>
                        <div className="flex gap-1.5 flex-wrap">
                          {req.status === 'PENDING' && (
                            <>
                              <ActionButton
                                label="Match"
                                variant="primary"
                                disabled={actionLoading === req.id}
                                onClick={() => {
                                  setError('')
                                  setActionLoading(req.id)
                                  matchMutation.mutate(req.id)
                                }}
                              />
                              <ActionButton
                                label="Reject"
                                variant="danger"
                                onClick={() => { setRejectModal(req); setRejectReason(''); setError('') }}
                              />
                            </>
                          )}
                          {req.status === 'MATCHED' && (
                            <ActionButton
                              label="Reject"
                              variant="danger"
                              onClick={() => { setRejectModal(req); setRejectReason(''); setError('') }}
                            />
                          )}
                          {req.status === 'ACCEPTED' && (
                            <ActionButton
                              label="Disburse"
                              variant="success"
                              disabled={actionLoading === req.id}
                              onClick={() => {
                                setError('')
                                setActionLoading(req.id)
                                disburseMutation.mutate(req.id)
                              }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Loan Request">
        {rejectModal && (
          <div className="space-y-4">
            <Alert type="error" message={error} />
            <div className="p-3 bg-ink-800/50 rounded-xl text-sm">
              <span className="text-ink-400">Request: </span>
              <span className="text-ink-200">{rejectModal.borrowerName} — {formatINR(rejectModal.amount)}</span>
            </div>
            <div>
              <label className="label">Rejection Reason *</label>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="Provide a clear reason for rejection"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setRejectModal(null)}>Cancel</button>
              <button
                className="btn-danger flex-1"
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason })}
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
