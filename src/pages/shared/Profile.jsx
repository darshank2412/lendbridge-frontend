import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getMyProfile, updateProfile, getAllPreferences } from '../../api/services'
import { SectionHeader, Field, Alert, PageLoader, Badge } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ fullName: user?.fullName || '', email: user?.email || '', gender: user?.gender || 'MALE' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  })

  const mutation = useMutation({
    mutationFn: () => updateProfile(form),
    onSuccess: (res) => {
      const updated = res.data?.data
      setUser(updated)
      qc.invalidateQueries(['my-profile'])
      setEditing(false)
      setSuccess('Profile updated successfully')
    },
    onError: e => setError(e.response?.data?.message || 'Update failed'),
  })

  const profile = data?.data?.data || user

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up max-w-2xl">
      <SectionHeader title="My Profile" subtitle="View and update your account information" />

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />
      {(error || success) && <div className="mb-4" />}

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/20 flex items-center justify-center text-xl font-display font-bold text-gold-400">
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-ink-100">{profile?.fullName}</h3>
              <div className="flex gap-2 mt-1">
                <Badge variant="gold">{profile?.role}</Badge>
                <Badge variant={profile?.kycStatus === 'VERIFIED' ? 'success' : 'warning'}>
                  KYC: {profile?.kycStatus}
                </Badge>
              </div>
            </div>
          </div>
          {!editing && (
            <button className="btn-secondary text-sm" onClick={() => {
              setForm({ fullName: profile?.fullName || '', email: profile?.email || '', gender: profile?.gender || 'MALE' })
              setEditing(true); setError(''); setSuccess('')
            }}>
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <Field label="Full Name">
              <input className="input" value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Gender">
              <select className="select" value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option>MALE</option><option>FEMALE</option><option>OTHER</option>
              </select>
            </Field>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['First Name', profile?.firstName],
              ['Last Name', profile?.lastName],
              ['Email', profile?.email],
              ['Mobile', profile?.mobileNumber],
              ['Date of Birth', profile?.dateOfBirth],
              ['Gender', profile?.gender],
              ['Income Bracket', profile?.incomeBracket?.replace(/_/g, ' ')],
              ['P2P Experience', profile?.p2pExperience],
              ['Platform Account', profile?.platformAccountNumber || '—'],
              ['Member Since', formatDate(profile?.createdAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-ink-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-ink-200 font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address */}
      {profile?.address && (
        <div className="card p-5">
          <p className="text-sm font-medium text-ink-200 mb-3">Address</p>
          <p className="text-ink-300">{profile.address.line1}</p>
          <p className="text-ink-400 text-sm">{profile.address.city}, {profile.address.state} — {profile.address.pincode}</p>
        </div>
      )}
    </div>
  )
}

export function AdminPreferences() {
  const { data, isLoading } = useQuery({
    queryKey: ['all-preferences'],
    queryFn: getAllPreferences,
  })

  const prefs = data?.data?.data || []

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <SectionHeader title="All Lender Preferences" subtitle="Platform-wide active lending preferences" />
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Lender</th>
              <th>Product</th>
              <th>Amount Range</th>
              <th>Interest</th>
              <th>Tenure</th>
              <th>Risk</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {prefs.map(p => (
              <tr key={p.id}>
                <td>
                  <p className="font-medium text-ink-200">{p.lenderName}</p>
                  <p className="text-xs text-ink-500">ID: {p.lenderId}</p>
                </td>
                <td>{p.loanProductName}</td>
                <td>{formatINR(p.minLoanAmount)} – {formatINR(p.maxLoanAmount)}</td>
                <td>{p.minInterestRate}% – {p.maxInterestRate}%</td>
                <td>{p.minTenureMonths} – {p.maxTenureMonths}m</td>
                <td>
                  <Badge variant={p.riskAppetite === 'LOW' ? 'success' : p.riskAppetite === 'HIGH' ? 'danger' : 'warning'}>
                    {p.riskAppetite}
                  </Badge>
                </td>
                <td>{p.isActive ? <span className="badge-active">Yes</span> : <span className="badge-inactive">No</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
