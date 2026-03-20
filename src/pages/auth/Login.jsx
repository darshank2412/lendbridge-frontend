import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Alert, Field, Spinner } from '../../components/ui'
import api from '../../api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login', {
        phoneNumber: form.phone,
        password: form.password
      })
      const { token, userId, role, fullName, status } = res.data?.data
      login({
        user: {
          id: userId,
          role,
          fullName,
          phoneNumber: form.phone,
          status,
          kycStatus: 'PENDING'
        },
        token: token
      })
      navigate(`/${role.toLowerCase()}`)
    } catch (err) {
      setError('Invalid phone number or password')
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

          <Alert type="error" message={error} />
          {error && <div className="mb-4" />}

          <form onSubmit={handleLogin} className="space-y-4">
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

          <p className="text-center text-sm text-ink-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300">Create one</Link>
          </p>

          {/* Admin hint */}
          <div className="mt-4 p-3 rounded-xl bg-ink-800/50 border border-ink-700 text-xs text-ink-500">
            <span className="text-ink-400 font-medium">Admin:</span> 9999999999 / Admin@123
          </div>
        </div>
      </div>
    </div>
  )
}