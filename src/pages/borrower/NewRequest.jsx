import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getLoanProducts, createLoanRequest } from '../../api/services'
import { SectionHeader, Field, Alert, PageLoader } from '../../components/ui'
import { calculateEmi, formatINR } from '../../utils/emi'

const PURPOSES = ['EDUCATION','SMALL_BUSINESS','EMERGENCY','ASSET_PURCHASE','MEDICAL','TRAVEL','OTHER']

export default function NewLoanRequest() {
  const { getUserId } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    loanProductId: '', amount: '', tenureMonths: 12,
    purpose: 'EDUCATION', purposeDescription: ''
  })
  const [error, setError] = useState('')

  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['loan-products'],
    queryFn: getLoanProducts,
  })

  const products = productsRes?.data?.data || []
  const selectedProduct = products.find(p => p.id === Number(form.loanProductId))

  const emi = form.amount && form.tenureMonths && selectedProduct
    ? calculateEmi(Number(form.amount), (selectedProduct.minInterest + selectedProduct.maxInterest) / 2, Number(form.tenureMonths))
    : null

  const mutation = useMutation({
    mutationFn: (data) => createLoanRequest(getUserId(), data),
    onSuccess: () => {
      qc.invalidateQueries(['my-loan-requests'])
      navigate('/borrower/loan-requests')
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to submit request'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      loanProductId: Number(form.loanProductId),
      amount: Number(form.amount),
      tenureMonths: Number(form.tenureMonths),
      purpose: form.purpose,
      purposeDescription: form.purposeDescription,
    })
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up max-w-2xl">
      <SectionHeader title="Apply for a Loan" subtitle="Choose a product and enter your details" />

      <Alert type="error" message={error} />
      {error && <div className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-medium text-ink-300 border-b border-ink-700 pb-3">Loan Details</h3>

          <Field label="Loan Product" required>
            <select className="select" value={form.loanProductId}
              onChange={e => setForm(f => ({ ...f, loanProductId: e.target.value }))}>
              <option value="">Select a loan product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          {selectedProduct && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-ink-800/50 rounded-xl text-xs">
              <div>
                <p className="text-ink-400">Amount Range</p>
                <p className="text-ink-200 font-medium mt-0.5">
                  {formatINR(selectedProduct.minAmount)} – {formatINR(selectedProduct.maxAmount)}
                </p>
              </div>
              <div>
                <p className="text-ink-400">Interest Rate</p>
                <p className="text-ink-200 font-medium mt-0.5">
                  {selectedProduct.minInterest}% – {selectedProduct.maxInterest}% p.a.
                </p>
              </div>
              <div>
                <p className="text-ink-400">Tenure</p>
                <p className="text-ink-200 font-medium mt-0.5">
                  {selectedProduct.minTenure} – {selectedProduct.maxTenure} months
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Loan Amount (₹)" required>
              <input className="input" type="number"
                min={selectedProduct?.minAmount} max={selectedProduct?.maxAmount}
                placeholder="e.g. 50000"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </Field>
            <Field label="Tenure (months)" required>
              <input className="input" type="number"
                min={selectedProduct?.minTenure || 6} max={selectedProduct?.maxTenure || 60}
                value={form.tenureMonths}
                onChange={e => setForm(f => ({ ...f, tenureMonths: e.target.value }))} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Purpose" required>
              <select className="select" value={form.purpose}
                onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}>
                {PURPOSES.map(p => <option key={p} value={p}>{p.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Description (optional)">
            <textarea className="input min-h-[80px] resize-none" placeholder="Brief description of why you need this loan"
              value={form.purposeDescription}
              onChange={e => setForm(f => ({ ...f, purposeDescription: e.target.value }))} />
          </Field>
        </div>

        {/* EMI Preview */}
        {emi && (
          <div className="card p-5 border-gold-500/20 bg-gold-500/5 animate-fade-in">
            <p className="text-xs text-gold-400 uppercase tracking-wider mb-3">EMI Preview (at avg rate)</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-display font-bold text-gold-400">{formatINR(emi)}</p>
                <p className="text-xs text-ink-400 mt-0.5">per month</p>
              </div>
              <div>
                <p className="text-lg font-display font-semibold text-ink-200">
                  {formatINR(emi * form.tenureMonths)}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">total payable</p>
              </div>
              <div>
                <p className="text-lg font-display font-semibold text-ruby-400">
                  {formatINR(emi * form.tenureMonths - form.amount)}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">total interest</p>
              </div>
            </div>
            <p className="text-xs text-ink-500 mt-3">Final EMI depends on accepted interest rate</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending || !form.loanProductId}>
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
