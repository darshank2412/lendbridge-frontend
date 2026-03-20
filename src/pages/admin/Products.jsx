import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLoanProducts, createLoanProduct, updateLoanProduct, deactivateLoanProduct,
  getSavingsProducts, createSavingsProduct, updateSavingsProduct, deactivateSavingsProduct
} from '../../api/services'
import { SectionHeader, Modal, Field, Alert, PageLoader, Badge, EmptyState } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'

const defaultLoanForm = {
  name: '', minAmount: 10000, maxAmount: 500000,
  minInterest: 8, maxInterest: 24, minTenure: 6, maxTenure: 60
}

const defaultSavingsForm = {
  name: '', minBalance: 500, maxBalance: 1000000, interestRate: 4.5
}

function ProductCard({ product, onEdit, onDeactivate, type }) {
  const isLoan = type === 'loan'
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-ink-100">{product.name}</p>
          <div className="mt-1">
            <Badge variant={product.status === 'ACTIVE' ? 'success' : 'default'}>
              {product.status}
            </Badge>
          </div>
        </div>
        <span className="text-xs text-ink-500">ID: {product.id}</span>
      </div>
      <div className="space-y-1.5 mb-4">
        {isLoan ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-ink-400">Amount</span>
              <span className="text-ink-200">{formatINR(product.minAmount)} – {formatINR(product.maxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-400">Interest</span>
              <span className="text-ink-200">{product.minInterest}% – {product.maxInterest}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-400">Tenure</span>
              <span className="text-ink-200">{product.minTenure} – {product.maxTenure} months</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-ink-400">Balance Range</span>
              <span className="text-ink-200">{formatINR(product.minBalance)} – {formatINR(product.maxBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-400">Interest Rate</span>
              <span className="text-gold-400 font-medium">{product.interestRate}% p.a.</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-ink-400">Created</span>
          <span className="text-ink-500">{formatDate(product.createdAt)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(product)} className="btn-secondary flex-1 text-xs">Edit</button>
        {product.status === 'ACTIVE' && (
          <button onClick={() => onDeactivate(product.id)} className="btn-danger flex-1 text-xs">Deactivate</button>
        )}
      </div>
    </div>
  )
}

export function AdminLoanProducts() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultLoanForm)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['loan-products'], queryFn: getLoanProducts })

  const saveMutation = useMutation({
    mutationFn: () => editingId
      ? updateLoanProduct(editingId, { ...form, minAmount: +form.minAmount, maxAmount: +form.maxAmount, minInterest: +form.minInterest, maxInterest: +form.maxInterest, minTenure: +form.minTenure, maxTenure: +form.maxTenure })
      : createLoanProduct({ ...form, minAmount: +form.minAmount, maxAmount: +form.maxAmount, minInterest: +form.minInterest, maxInterest: +form.maxInterest, minTenure: +form.minTenure, maxTenure: +form.maxTenure }),
    onSuccess: () => { qc.invalidateQueries(['loan-products']); setModal(false) },
    onError: e => setError(e.response?.data?.message || 'Save failed'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => deactivateLoanProduct(id),
    onSuccess: () => qc.invalidateQueries(['loan-products']),
    onError: e => setError(e.response?.data?.message || 'Deactivate failed'),
  })

  const products = data?.data?.data || []
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="Loan Products"
        subtitle="Manage available loan product configurations"
        action={
          <button className="btn-primary text-sm" onClick={() => {
            setForm(defaultLoanForm); setEditingId(null); setError(''); setModal(true)
          }}>+ New Product</button>
        }
      />
      <Alert type="error" message={error} />
      {error && <div className="mb-4" />}
      {products.length === 0 ? <EmptyState icon="◫" title="No loan products" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} type="loan"
              onEdit={(p) => { setForm({ name: p.name, minAmount: p.minAmount, maxAmount: p.maxAmount, minInterest: p.minInterest, maxInterest: p.maxInterest, minTenure: p.minTenure, maxTenure: p.maxTenure }); setEditingId(p.id); setError(''); setModal(true) }}
              onDeactivate={(id) => deactivateMutation.mutate(id)}
            />
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Edit Loan Product' : 'New Loan Product'} size="lg">
        <Alert type="error" message={error} />
        {error && <div className="mb-4" />}
        <div className="space-y-4">
          <Field label="Product Name" required>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Personal Loan" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Amount (₹)"><input className="input" type="number" value={form.minAmount} onChange={e => set('minAmount', e.target.value)} /></Field>
            <Field label="Max Amount (₹)"><input className="input" type="number" value={form.maxAmount} onChange={e => set('maxAmount', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Interest %"><input className="input" type="number" step="0.5" min="8" max="24" value={form.minInterest} onChange={e => set('minInterest', e.target.value)} /></Field>
            <Field label="Max Interest %"><input className="input" type="number" step="0.5" min="8" max="24" value={form.maxInterest} onChange={e => set('maxInterest', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Tenure (months)"><input className="input" type="number" min="6" max="60" value={form.minTenure} onChange={e => set('minTenure', e.target.value)} /></Field>
            <Field label="Max Tenure (months)"><input className="input" type="number" min="6" max="60" value={form.maxTenure} onChange={e => set('maxTenure', e.target.value)} /></Field>
          </div>
          <button className="btn-primary w-full" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export function AdminSavingsProducts() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultSavingsForm)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['savings-products'], queryFn: getSavingsProducts })

  const saveMutation = useMutation({
    mutationFn: () => editingId
      ? updateSavingsProduct(editingId, { ...form, minBalance: +form.minBalance, maxBalance: +form.maxBalance, interestRate: +form.interestRate })
      : createSavingsProduct({ ...form, minBalance: +form.minBalance, maxBalance: +form.maxBalance, interestRate: +form.interestRate }),
    onSuccess: () => { qc.invalidateQueries(['savings-products']); setModal(false) },
    onError: e => setError(e.response?.data?.message || 'Save failed'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => deactivateSavingsProduct(id),
    onSuccess: () => qc.invalidateQueries(['savings-products']),
  })

  const products = data?.data?.data || []
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="Savings Products"
        subtitle="Manage savings account product offerings"
        action={
          <button className="btn-primary text-sm" onClick={() => {
            setForm(defaultSavingsForm); setEditingId(null); setError(''); setModal(true)
          }}>+ New Product</button>
        }
      />
      <Alert type="error" message={error} />
      {error && <div className="mb-4" />}
      {products.length === 0 ? <EmptyState icon="◎" title="No savings products" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} type="savings"
              onEdit={(p) => { setForm({ name: p.name, minBalance: p.minBalance, maxBalance: p.maxBalance, interestRate: p.interestRate }); setEditingId(p.id); setError(''); setModal(true) }}
              onDeactivate={(id) => deactivateMutation.mutate(id)}
            />
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Edit Savings Product' : 'New Savings Product'}>
        <Alert type="error" message={error} />
        {error && <div className="mb-4" />}
        <div className="space-y-4">
          <Field label="Product Name" required>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Basic Savings Account" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Balance (₹)"><input className="input" type="number" value={form.minBalance} onChange={e => set('minBalance', e.target.value)} /></Field>
            <Field label="Max Balance (₹)"><input className="input" type="number" value={form.maxBalance} onChange={e => set('maxBalance', e.target.value)} /></Field>
          </div>
          <Field label="Interest Rate (% p.a.)">
            <input className="input" type="number" step="0.1" min="2" max="12" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} />
          </Field>
          <button className="btn-primary w-full" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
