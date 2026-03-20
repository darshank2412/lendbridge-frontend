import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getKycDocuments, approveKyc, rejectKyc } from '../../api/services'
import { SectionHeader, Modal, Alert, StatusBadge, PageLoader, Field } from '../../components/ui'
import { formatDateTime } from '../../utils/emi'

function KycReviewCard({ doc, onApprove, onReject, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-ink-100">{doc.documentType}</span>
            <StatusBadge status={doc.status} type="kyc" />
          </div>
          <p className="text-xs font-mono text-ink-400">{doc.documentNumber}</p>
          <p className="text-xs text-ink-500 mt-1">Submitted {formatDateTime(doc.submittedAt)}</p>
        </div>
        <span className="text-xs text-ink-500">ID: {doc.id}</span>
      </div>
      {doc.documentUrl && (
        <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-sapphire-400 hover:underline block mb-3">
          View Document →
        </a>
      )}
      {doc.rejectionNote && (
        <p className="text-xs text-ruby-400 mb-3">Note: {doc.rejectionNote}</p>
      )}
      {doc.status === 'PENDING' && (
        <div className="flex gap-2">
          <button onClick={() => onApprove(doc.id)} className="btn-success flex-1 text-xs" disabled={loading}>
            Approve
          </button>
          <button onClick={() => onReject(doc)} className="btn-danger flex-1 text-xs" disabled={loading}>
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminKyc() {
  const qc = useQueryClient()
  const [userId, setUserId] = useState('')
  const [searchId, setSearchId] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['kyc-docs-admin', searchId],
    queryFn: () => getKycDocuments(searchId),
    enabled: !!searchId,
  })

  const approveMutation = useMutation({
    mutationFn: (docId) => approveKyc(docId),
    onSuccess: () => qc.invalidateQueries(['kyc-docs-admin']),
    onError: (e) => setError(e.response?.data?.message || 'Approve failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ docId, reason }) => rejectKyc(docId, reason),
    onSuccess: () => { qc.invalidateQueries(['kyc-docs-admin']); setRejectModal(null); setRejectNote('') },
    onError: (e) => setError(e.response?.data?.message || 'Reject failed'),
  })

  const docs = data?.data?.data || []

  return (
    <div className="animate-fade-up">
      <SectionHeader title="KYC Document Review" subtitle="Approve or reject user KYC submissions" />

      <Alert type="error" message={error} />
      {error && <div className="mb-4" />}

      {/* User ID search */}
      <div className="card p-5 mb-6">
        <p className="text-sm font-medium text-ink-200 mb-3">Search by User ID</p>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Enter user ID"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearchId(userId)}
          />
          <button
            className="btn-primary px-6"
            onClick={() => { setSearchId(userId); setError('') }}
            disabled={!userId}
          >
            Search
          </button>
        </div>
      </div>

      {isLoading && <PageLoader />}

      {searchId && !isLoading && (
        <div>
          {docs.length === 0 ? (
            <div className="card p-8 text-center text-ink-400 text-sm">
              No KYC documents found for User #{searchId}
            </div>
          ) : (
            <div>
              <p className="text-xs text-ink-400 mb-3">
                {docs.length} document{docs.length !== 1 ? 's' : ''} for User #{searchId}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map(doc => (
                  <KycReviewCard
                    key={doc.id}
                    doc={doc}
                    loading={approveMutation.isPending || rejectMutation.isPending}
                    onApprove={(docId) => { setError(''); approveMutation.mutate(docId) }}
                    onReject={(doc) => { setRejectModal(doc); setRejectNote(''); setError('') }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Document">
        {rejectModal && (
          <div className="space-y-4">
            <div className="p-3 bg-ink-800/50 rounded-xl text-sm">
              <span className="text-ink-400">{rejectModal.documentType}: </span>
              <span className="text-ink-200 font-mono">{rejectModal.documentNumber}</span>
            </div>
            <Field label="Rejection Reason" required>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="Explain why this document is being rejected"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
              />
            </Field>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setRejectModal(null)}>Cancel</button>
              <button
                className="btn-danger flex-1"
                disabled={!rejectNote.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ docId: rejectModal.id, reason: rejectNote })}
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Document'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
