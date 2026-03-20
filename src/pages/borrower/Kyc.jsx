import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getKycDocuments, submitKyc } from '../../api/services'
import { SectionHeader, Field, Alert, StatusBadge, PageLoader, EmptyState } from '../../components/ui'
import { formatDateTime } from '../../utils/emi'

const DOC_TYPES = ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID']

export default function BorrowerKyc() {
  const { getUserId, user } = useAuthStore()
  const userId = getUserId()
  const qc = useQueryClient()
  const [form, setForm] = useState({ documentType: 'AADHAAR', documentNumber: '', documentUrl: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['kyc-docs', userId],
    queryFn: () => getKycDocuments(userId),
    enabled: !!userId,
  })

  const mutation = useMutation({
    mutationFn: (formData) => submitKyc(userId, formData),
    onSuccess: () => {
      qc.invalidateQueries(['kyc-docs'])
      setSuccess('Document submitted successfully. Pending review.')
      setForm({ documentType: 'AADHAAR', documentNumber: '', documentUrl: '' })
    },
    onError: (err) => setError(err.response?.data?.message || 'Submission failed'),
  })

  const docs = data?.data?.data || []

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    mutation.mutate(form)
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up max-w-3xl">
      <SectionHeader title="KYC Documents" subtitle="Submit your identity documents for verification" />

      {/* Overall KYC status */}
      <div className={`card p-5 mb-6 border-l-4 ${
        user?.kycStatus === 'VERIFIED' ? 'border-l-emerald-500' :
        user?.kycStatus === 'REJECTED' ? 'border-l-ruby-500' : 'border-l-amber-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wider mb-1">Overall KYC Status</p>
            <StatusBadge status={user?.kycStatus || 'PENDING'} type="kyc" />
          </div>
          {user?.kycStatus === 'VERIFIED' && (
            <div className="text-emerald-400 text-2xl">✓</div>
          )}
        </div>
        {user?.kycStatus !== 'VERIFIED' && (
          <p className="text-xs text-ink-400 mt-2">
            Both AADHAAR and PAN are required for full KYC approval
          </p>
        )}
      </div>

      {/* Submitted docs */}
      {docs.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-ink-700">
            <p className="text-sm font-medium text-ink-200">Submitted Documents</p>
          </div>
          <div className="divide-y divide-ink-800">
            {docs.map(doc => (
              <div key={doc.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-ink-200">{doc.documentType}</span>
                    <StatusBadge status={doc.status} type="kyc" />
                  </div>
                  <p className="text-xs text-ink-400 font-mono">{doc.documentNumber}</p>
                  {doc.rejectionNote && (
                    <p className="text-xs text-ruby-400 mt-1">Rejected: {doc.rejectionNote}</p>
                  )}
                  <p className="text-xs text-ink-500 mt-1">Submitted {formatDateTime(doc.submittedAt)}</p>
                </div>
                {doc.reviewedAt && (
                  <p className="text-xs text-ink-500">Reviewed {formatDateTime(doc.reviewedAt)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit new doc */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-ink-200 mb-4">Submit a Document</h3>
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
        {(error || success) && <div className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Document Type" required>
            <select className="select" value={form.documentType}
              onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <Field label="Document Number" required>
            <input className="input font-mono uppercase"
              placeholder={form.documentType === 'AADHAAR' ? '1234 5678 9012' : 'ABCDE1234F'}
              value={form.documentNumber}
              onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Document URL (optional)">
            <input className="input" placeholder="https://s3.example.com/kyc/doc.pdf"
              value={form.documentUrl}
              onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))} />
          </Field>
          <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit Document'}
          </button>
        </form>
      </div>
    </div>
  )
}
