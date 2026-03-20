import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { sendOtp, verifyOtp, register } from '../../api/services'
import { useAuthStore } from '../../store/authStore'
import { Alert, Field, Spinner } from '../../components/ui'

const STEPS = { SEND_OTP: 0, VERIFY_OTP: 1, REGISTER: 2 }

const INCOME_BRACKETS = [
  'BELOW_2_LPA', '2_5_LPA', '5_10_LPA', '10_20_LPA', '20_50_LPA', 'ABOVE_50_LPA'
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [step, setStep] = useState(STEPS.SEND_OTP)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)

  const [otpForm, setOtpForm] = useState({
    identifier: '', countryCode: '+91', otpType: 'PHONE', purpose: 'REGISTRATION', role: 'BORROWER'
  })
  const [otpCode, setOtpCode] = useState('')
  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '',
    dateOfBirth: '', gender: 'MALE', role: 'BORROWER', pan: '',
    incomeBracket: '5_10_LPA', p2pExperience: 'BEGINNER', password: '',
    address: { line1: '', city: '', state: '', pincode: '' }
  })

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await sendOtp(otpForm)
      setStep(STEPS.VERIFY_OTP)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await verifyOtp({ ...otpForm, otpCode })
      const uid = res.data?.data?.userId
      setUserId(uid)
      setRegForm(f => ({ ...f, role: otpForm.role, phoneNumber: otpForm.identifier }))
      setStep(STEPS.REGISTER)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await register(userId, regForm)
      const user = res.data?.data
      login({
        user,
        credentials: { username: regForm.phoneNumber, password: regForm.password }
      })
      navigate(`/${user.role.toLowerCase()}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-ink-900 border-r border-ink-800 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
              <span className="text-ink-950 text-sm font-display font-bold">LB</span>
            </div>
            <span className="font-display font-bold text-ink-100 text-xl">LendBridge</span>
          </div>
          <h1 className="font-display text-5xl font-bold text-ink-100 leading-tight mb-4">
            Peer-to-peer<br />
            <span className="text-gold-500">lending</span><br />
            simplified.
          </h1>
          <p className="text-ink-400 text-lg leading-relaxed max-w-sm">
            Connect borrowers and lenders directly. Transparent rates, fast disbursement, full control.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Active Loans', value: '₹2.4Cr' },
            { label: 'Avg Rate', value: '12.4%' },
            { label: 'Borrowers', value: '1,240' },
            { label: 'Lenders', value: '380' },
          ].map(s => (
            <div key={s.label} className="bg-ink-800/50 rounded-xl p-4 border border-ink-700">
              <p className="text-2xl font-display font-bold text-ink-100">{s.value}</p>
              <p className="text-xs text-ink-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex gap-2 mb-6">
              {['Phone', 'Verify OTP', 'Complete'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    i < step ? 'bg-gold-500 text-ink-950' :
                    i === step ? 'bg-gold-500/20 border border-gold-500 text-gold-400' :
                    'bg-ink-800 text-ink-500'
                  }`}>{i < step ? '✓' : i + 1}</div>
                  <span className={`text-xs ${i === step ? 'text-ink-200' : 'text-ink-500'}`}>{s}</span>
                  {i < 2 && <div className="w-6 h-px bg-ink-700" />}
                </div>
              ))}
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-100">
              {step === 0 ? 'Create your account' : step === 1 ? 'Verify your number' : 'Complete profile'}
            </h2>
          </div>

          <Alert type="error" message={error} />
          {error && <div className="mb-4" />}

          {step === STEPS.SEND_OTP && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Field label="I am a" required>
                <select className="select" value={otpForm.role}
                  onChange={e => setOtpForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="BORROWER">Borrower</option>
                  <option value="LENDER">Lender</option>
                </select>
              </Field>
              <Field label="Mobile Number" required>
                <div className="flex gap-2">
                  <input className="input w-20" value="+91" readOnly />
                  <input className="input flex-1" placeholder="9876543210" value={otpForm.identifier}
                    onChange={e => setOtpForm(f => ({ ...f, identifier: e.target.value }))} />
                </div>
              </Field>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Send OTP'}
              </button>
              <p className="text-center text-sm text-ink-400">
                Already have an account?{' '}
                <Link to="/login" className="text-gold-400 hover:text-gold-300">Sign in</Link>
              </p>
            </form>
          )}

          {step === STEPS.VERIFY_OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Field label="OTP Code" required>
                <input className="input text-center tracking-[0.5em] text-lg font-mono"
                  placeholder="123456" maxLength={6} value={otpCode}
                  onChange={e => setOtpCode(e.target.value)} />
              </Field>
              <p className="text-xs text-ink-400">Sent to {otpForm.identifier}</p>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => setStep(0)} className="btn-ghost w-full">
                ← Back
              </button>
            </form>
          )}

          {step === STEPS.REGISTER && (
            <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" required>
                  <input className="input" value={regForm.firstName}
                    onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))} />
                </Field>
                <Field label="Last Name" required>
                  <input className="input" value={regForm.lastName}
                    onChange={e => setRegForm(f => ({ ...f, lastName: e.target.value }))} />
                </Field>
              </div>
              <Field label="Email" required>
                <input className="input" type="email" value={regForm.email}
                  onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of Birth" required>
                  <input className="input" type="date" value={regForm.dateOfBirth}
                    onChange={e => setRegForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                </Field>
                <Field label="Gender" required>
                  <select className="select" value={regForm.gender}
                    onChange={e => setRegForm(f => ({ ...f, gender: e.target.value }))}>
                    <option>MALE</option><option>FEMALE</option><option>OTHER</option>
                  </select>
                </Field>
              </div>
              <Field label="PAN Number" required>
                <input className="input font-mono uppercase" placeholder="ABCDE1234F"
                  value={regForm.pan}
                  onChange={e => setRegForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Income Bracket" required>
                  <select className="select" value={regForm.incomeBracket}
                    onChange={e => setRegForm(f => ({ ...f, incomeBracket: e.target.value }))}>
                    {INCOME_BRACKETS.map(b => <option key={b} value={b}>{b.replace(/_/g,' ')}</option>)}
                  </select>
                </Field>
                <Field label="P2P Experience">
                  <select className="select" value={regForm.p2pExperience}
                    onChange={e => setRegForm(f => ({ ...f, p2pExperience: e.target.value }))}>
                    <option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option>
                  </select>
                </Field>
              </div>
              <Field label="Address Line 1" required>
                <input className="input" value={regForm.address.line1}
                  onChange={e => setRegForm(f => ({ ...f, address: { ...f.address, line1: e.target.value } }))} />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="City" required>
                  <input className="input" value={regForm.address.city}
                    onChange={e => setRegForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
                </Field>
                <Field label="State" required>
                  <input className="input" value={regForm.address.state}
                    onChange={e => setRegForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
                </Field>
                <Field label="Pincode" required>
                  <input className="input" value={regForm.address.pincode}
                    onChange={e => setRegForm(f => ({ ...f, address: { ...f.address, pincode: e.target.value } }))} />
                </Field>
              </div>
              <Field label="Password" required>
                <input className="input" type="password" value={regForm.password}
                  onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
                <span className="text-xs text-ink-500">Min 8 chars, uppercase, lowercase, digit, special char</span>
              </Field>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
