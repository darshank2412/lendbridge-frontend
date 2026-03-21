import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Alert, Field, Spinner } from '../../components/ui'
import api from '../../api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [mode, setMode] = useState('password') // 'password' | 'otp'
  const [step, setStep] = useState(1) // 1=phone, 2=otp
  const [form, setForm] = useState({ phone: '', password: '', otp: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login', {
        phoneNumber: form.phone,
        password: form.password
      })
      const { token, userId, role, fullName, status } = res.data?.data
      login({ user: { id: userId, role, fullName, phoneNumber: form.phone, status, kycStatus: 'PENDING' }, token })
      navigate(`/${role.toLowerCase()}`)
    } catch (err) {
      setError('Invalid phone number or password')
    } finally { setLoading(false) }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      await api.post('/auth/otp/send', { phoneNumber: `+91${form.phone}`, purpose: 'LOGIN' })
      setStep(2)
      setSuccess('OTP sent to your mobile number!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/otp/verify', {
        phoneNumber: `+91${form.phone}`,
        otp: form.otp,
        purpose: 'LOGIN'
      })
      const { token, userId, role, fullName, status } = res.data?.data
      login({ user: { id: userId, role, fullName, phoneNumber: form.phone, status, kycStatus: 'PENDING' }, token })
      navigate(`/${role.toLowerCase()}`)
    } catch (err) {
      setError('Invalid or expired OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center">
            <span className="text-ink-950 text-base font-display font-bold">LB</span>
          </div>
          <span className="font-display font-bold text-ink-100 text-2xl">LendBridge</span>
        </div>

        <div className="card p-8 animate-fade-up">
          <h2 className="font-display text-2xl font-bold text-ink-100 mb-1">Welcome back</h2>
          <p className="text-ink-400 text-sm mb-6">Sign in to your account</p>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-ink-800 rounded-xl">
            <button
              onClick={() => { setMode('password'); setError(''); setSuccess(''); setStep(1) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'password'
                  ? 'bg-gold-500 text-ink-950'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setMode('otp'); setError(''); setSuccess(''); setStep(1) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'otp'
                  ? 'bg-gold-500 text-ink-950'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              OTP Login
            </button>
          </div>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />
          {(error || success) && <div className="mb-4" />}

          {/* Password Login */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Field label="Mobile Number" required>
                <input
                  className="input"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </Field>
              <Field label="Password" required>
                <input
                  className="input"
                  type="password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </Field>
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Sign In'}
              </button>
            </form>
          )}

          {/* OTP Login */}
          {mode === 'otp' && step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Field label="Mobile Number" required>
                <div className="flex gap-2">
                  <div className="px-3 py-2 bg-ink-800 border border-ink-700 rounded-xl text-ink-400 text-sm">
                    +91
                  </div>
                  <input
                    className="input flex-1"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </Field>
              <button type="submit" className="btn-primary w-full" disabled={loading || !form.phone}>
                {loading ? <Spinner size="sm" /> : 'Send OTP'}
              </button>
            </form>
          )}

          {mode === 'otp' && step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-ink-800/50 rounded-xl text-sm text-ink-400">
                OTP sent to <span className="text-gold-400">+91{form.phone}</span>
              </div>
              <Field label="Enter OTP" required>
                <input
                  className="input text-center text-2xl tracking-widest"
                  placeholder="------"
                  maxLength={6}
                  value={form.otp}
                  onChange={e => setForm(f => ({ ...f, otp: e.target.value }))}
                />
              </Field>
              <button type="submit" className="btn-primary w-full" disabled={loading || form.otp.length < 4}>
                {loading ? <Spinner size="sm" /> : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setSuccess('') }}
                className="w-full text-center text-sm text-ink-400 hover:text-ink-200"
              >
                ← Change number
              </button>
            </form>
          )}

          <p className="text-center text-sm text-ink-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}