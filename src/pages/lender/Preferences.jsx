import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getMyPreferences, savePreference, deactivatePreference, getLoanProducts } from '../../api/services'
import { SectionHeader, Modal, Field, Alert, PageLoader, Badge } from '../../components/ui'
import { formatINR } from '../../utils/emi'

const defaultForm = {
  loanProductId: '',
  minInterestRate: 10, maxInterestRate: 18,
  minTenureMonths: 6, maxTenureMonths: 36,
  minLoanAmount: 10000, maxLoanAmount: 200000,
  riskAppetite: 'MEDIUM',
}

export default function LenderPreferences() {
  const { getUserId } = useAuthStore()
  const lenderId = getUserId()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-preferences', lenderId],
    queryFn: () => getMyPreferences(lenderId),
    enabled: !!lenderId,
  })

  const { data: productsRes } = useQuery({
    queryKey: ['loan-products'],
    queryFn: getLoanProducts,
  })

  const saveMutation = useMutation({
    mutationFn: () => savePreference(lenderId, {
      ...form,
      loanProductId: Number(form.loanProductId),
      minInterestRate: Number(form.minInterestRate),
      maxInterestRate: Number(form.maxInterestRate),
      minTenureMonths: Number(form.minTenureMonths),
      maxTenureMonths: Number(form.maxTenureMonths),
      minLoanAmount: Number(form.minLoanAmount),
      maxLoanAmount: Number(form.maxLoanAmount),
    }),
    onSuccess: () => { qc.invalidateQueries(['my-preferences']); setModal(false) },
    onError: (e) => setError(e.response?.data?.message || 'Save failed'),
  })

  const deactivateMutation = useMutation({
    mutationFn: ({ loanProductId }) => deactivatePreference(lenderId, loanProductId),
    onSuccess: () => qc.invalidateQueries(['my-preferences']),
  })

  const prefs = data?.data?.data || []
  const products = productsRes?.data?.data || []

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="My Lending Preferences"
        subtitle="Set your lending criteria per loan product"
        action={
          <button onClick={() => { setForm(defaultForm); setError(''); setModal(true) }}
            className="btn-primary text-sm">
            + Add Preference
          </button>
        }
      />

      {prefs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">⚙️</p>
          <p className="text-ink-300 font-medium">No preferences set</p>
          <p className="text-ink-500 text-sm mt-1">Add preferences to start matching with borrowers</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {prefs.map(pref => (
            <div key={pref.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-medium text-ink-100">{pref.loanProductName}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={pref.isActive ? 'success' : 'default'}>
                      {pref.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant={pref.riskAppetite === 'LOW' ? 'success' : pref.riskAppetite === 'HIGH' ? 'danger' : 'warning'}>
                      {pref.riskAppetite} risk
                    </Badge>
                  </div>
                </div>
                {pref.isActive && (
                  <button
                    onClick={() => deactivateMutation.mutate({ loanProductId: pref.loanProductId })}
                    className="text-xs text-ruby-400 hover:underline"
                    disabled={deactivateMutation.isPending}
                  >
                    Deactivate
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">Amount</span>
                  <span className="text-ink-200">{formatINR(pref.minLoanAmount)} – {formatINR(pref.maxLoanAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">Interest</span>
                  <span className="text-ink-200">{pref.minInterestRate}% – {pref.maxInterestRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">Tenure</span>
                  <span className="text-ink-200">{pref.minTenureMonths} – {pref.maxTenureMonths} months</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setForm({
                    loanProductId: pref.loanProductId,
                    minInterestRate: pref.minInterestRate,
                    maxInterestRate: pref.maxInterestRate,
                    minTenureMonths: pref.minTenureMonths,
                    maxTenureMonths: pref.maxTenureMonths,
                    minLoanAmount: pref.minLoanAmount,
                    maxLoanAmount: pref.maxLoanAmount,
                    riskAppetite: pref.riskAppetite,
                  })
                  setError('')
                  setModal(true)
                }}
                className="btn-ghost w-full text-xs mt-4 border border-ink-700"
              >
                Edit Preference
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Set Lending Preference" size="lg">
        <Alert type="error" message={error} />
        {error && <div className="mb-4" />}
        <div className="space-y-4">
          <Field label="Loan Product" required>
            <select className="select" value={form.loanProductId}
              onChange={e => set('loanProductId', e.target.value)}>
              <option value="">Select product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Amount (₹)" required>
              <input className="input" type="number" value={form.minLoanAmount}
                onChange={e => set('minLoanAmount', e.target.value)} />
            </Field>
            <Field label="Max Amount (₹)" required>
              <input className="input" type="number" value={form.maxLoanAmount}
                onChange={e => set('maxLoanAmount', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Interest %" required>
              <input className="input" type="number" min={8} max={24} step={0.5}
                value={form.minInterestRate} onChange={e => set('minInterestRate', e.target.value)} />
            </Field>
            <Field label="Max Interest %" required>
              <input className="input" type="number" min={8} max={24} step={0.5}
                value={form.maxInterestRate} onChange={e => set('maxInterestRate', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Tenure (months)" required>
              <input className="input" type="number" min={6} max={60} step={6}
                value={form.minTenureMonths} onChange={e => set('minTenureMonths', e.target.value)} />
            </Field>
            <Field label="Max Tenure (months)" required>
              <input className="input" type="number" min={6} max={60} step={6}
                value={form.maxTenureMonths} onChange={e => set('maxTenureMonths', e.target.value)} />
            </Field>
          </div>
          <Field label="Risk Appetite" required>
            <select className="select" value={form.riskAppetite}
              onChange={e => set('riskAppetite', e.target.value)}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </Field>
          <button className="btn-primary w-full" onClick={() => saveMutation.mutate()}
            disabled={!form.loanProductId || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Preference'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
