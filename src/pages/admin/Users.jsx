import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllAdmins, createAdmin, deleteAdmin } from '../../api/services'
import { SectionHeader, Modal, Field, Alert, PageLoader, EmptyState } from '../../components/ui'
import { formatDate } from '../../utils/emi'

export default function AdminUsers() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ phoneNumber: '', countryCode: '+91', fullName: '', email: '', password: '' })
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['admins'], queryFn: getAllAdmins })

  const createMutation = useMutation({
    mutationFn: () => createAdmin(form),
    onSuccess: () => { qc.invalidateQueries(['admins']); setModal(false) },
    onError: e => setError(e.response?.data?.message || 'Failed to create admin'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdmin(id),
    onSuccess: () => qc.invalidateQueries(['admins']),
    onError: e => setError(e.response?.data?.message || 'Delete failed'),
  })

  const admins = data?.data?.data || []
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="Admin Users"
        subtitle="Manage platform administrators"
        action={
          <button className="btn-primary text-sm" onClick={() => {
            setForm({ phoneNumber: '', countryCode: '+91', fullName: '', email: '', password: '' })
            setError(''); setModal(true)
          }}>+ New Admin</button>
        }
      />
      <Alert type="error" message={error} />
      {error && <div className="mb-4" />}

      {admins.length === 0 ? <EmptyState icon="◌" title="No admins found" /> : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>KYC</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id}>
                  <td className="font-mono text-xs text-ink-400">#{admin.id}</td>
                  <td>
                    <p className="font-medium text-ink-200">{admin.fullName}</p>
                    <p className="text-xs text-ink-500">{admin.role}</p>
                  </td>
                  <td className="text-sm">{admin.email}</td>
                  <td className="font-mono text-sm">{admin.mobileNumber}</td>
                  <td><span className="badge-active">{admin.status}</span></td>
                  <td><span className={admin.kycStatus === 'VERIFIED' ? 'badge-verified' : 'badge-pending'}>{admin.kycStatus}</span></td>
                  <td className="text-xs text-ink-400">{formatDate(admin.createdAt)}</td>
                  <td>
                    <button
                      className="text-xs text-ruby-400 hover:underline"
                      onClick={() => { if (confirm(`Delete admin ${admin.fullName}?`)) deleteMutation.mutate(admin.id) }}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Admin User">
        <Alert type="error" message={error} />
        {error && <div className="mb-4" />}
        <div className="space-y-4">
          <Field label="Full Name" required>
            <input className="input" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Admin User" />
          </Field>
          <Field label="Mobile Number" required>
            <div className="flex gap-2">
              <input className="input w-20" value="+91" readOnly />
              <input className="input flex-1" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="9999999999" />
            </div>
          </Field>
          <Field label="Email" required>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@lending.com" />
          </Field>
          <Field label="Password" required>
            <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 chars" />
            <span className="text-xs text-ink-500">Min 8 chars, uppercase, lowercase, special char</span>
          </Field>
          <button className="btn-primary w-full" onClick={() => createMutation.mutate()}
            disabled={!form.fullName || !form.phoneNumber || !form.email || !form.password || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Admin'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
