import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function AnimatedCounter({ target, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-gold-500/10"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animation: `pulseSoft ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: Math.random() * 2 + 's'
          }}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { icon: '🔗', title: 'Direct P2P Lending', desc: 'Connect directly with verified borrowers and lenders. No banks, no middlemen, full transparency.' },
    { icon: '⚡', title: 'Instant Disbursement', desc: 'Loan approved? Funds disbursed within minutes directly to your account.' },
    { icon: '🛡️', title: 'KYC Verified Users', desc: 'Every user is KYC verified. Your money is always in safe, trusted hands.' },
    { icon: '📊', title: 'Smart Credit Scoring', desc: 'Our AI-powered credit engine gives you real-time scores and lending insights.' },
    { icon: '📱', title: 'OTP Authentication', desc: 'Bank-grade security with mobile OTP and JWT-based session management.' },
    { icon: '📄', title: 'Digital Agreements', desc: 'Auto-generated PDF loan agreements with full EMI schedules and terms.' },
  ]

  const steps = [
    { num: '01', title: 'Register & KYC', desc: 'Sign up with your mobile number, verify OTP, complete KYC in under 5 minutes.' },
    { num: '02', title: 'Create or Browse', desc: 'Borrowers post loan requests. Lenders browse and set their lending preferences.' },
    { num: '03', title: 'Match & Disburse', desc: 'Our platform matches lenders with borrowers. Admin approves and disburses.' },
    { num: '04', title: 'Repay via EMI', desc: 'Borrowers repay in easy monthly EMIs. Lenders earn interest on their funds.' },
  ]

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 font-sans overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-ink-950/90 backdrop-blur-md border-b border-ink-800' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
              <span className="text-ink-950 text-sm font-display font-bold">LB</span>
            </div>
            <span className="font-display font-bold text-ink-100 text-xl">LendBridge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-ink-400 hover:text-ink-100 text-sm transition-colors">
              Sign In
            </Link>
            <Link to="/register"
              className="px-4 py-2 rounded-xl bg-gold-500 text-ink-950 text-sm font-medium hover:bg-gold-400 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <FloatingParticles />
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
            style={{background: 'radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 70%)'}} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
            style={{background: 'radial-gradient(circle, rgba(212,168,83,0.05) 0%, transparent 70%)'}} />
        </div>
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(212,168,83,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

        <div className="relative max-w-4xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-500/30 bg-gold-500/5 text-gold-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
            India's Smart P2P Lending Platform
          </div>

          <h1 className="font-display text-6xl md:text-7xl font-bold leading-tight mb-6">
            Lending at the<br />
            <span className="text-gold-500">speed of trust.</span>
          </h1>

          <p className="text-ink-400 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Connect borrowers and lenders directly. Transparent rates, instant disbursement,
            zero middlemen. Your money, your terms, your bridge.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register"
              className="px-8 py-4 rounded-xl bg-gold-500 text-ink-950 font-display font-bold text-lg hover:bg-gold-400 transition-all hover:scale-105">
              Start Borrowing →
            </Link>
            <Link to="/register?role=LENDER"
              className="px-8 py-4 rounded-xl border border-ink-700 text-ink-200 font-medium text-lg hover:border-gold-500/50 hover:text-gold-400 transition-all">
              Start Lending
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { target: 240, suffix: 'Cr+', prefix: '₹', label: 'Active Loans' },
              { target: 124, suffix: '%', prefix: '', label: 'Avg Interest Rate', special: '12.4%' },
              { target: 1240, suffix: '+', prefix: '', label: 'Borrowers' },
              { target: 380, suffix: '+', prefix: '', label: 'Lenders' },
            ].map((stat, i) => (
              <div key={i} className="bg-ink-900/50 backdrop-blur-sm border border-ink-800 rounded-xl p-4">
                <p className="font-display text-2xl font-bold text-gold-400">
                  {stat.special || <AnimatedCounter target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />}
                </p>
                <p className="text-xs text-ink-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-400 text-sm font-medium mb-3 tracking-widest uppercase">Features</p>
            <h2 className="font-display text-4xl font-bold text-ink-100 mb-4">
              Everything you need to lend smart
            </h2>
            <p className="text-ink-400 text-lg max-w-2xl mx-auto">
              Built with modern fintech standards — secure, transparent, and lightning fast.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i}
                className="p-6 rounded-2xl border border-ink-800 bg-ink-900/50 hover:border-gold-500/30 hover:bg-ink-900 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4 group-hover:bg-gold-500/20 transition-all">
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-100 mb-2">{f.title}</h3>
                <p className="text-ink-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-ink-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-400 text-sm font-medium mb-3 tracking-widest uppercase">How it Works</p>
            <h2 className="font-display text-4xl font-bold text-ink-100 mb-4">
              Simple. Transparent. Fast.
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gold-500/30 to-transparent z-10" />
                )}
                <div className="p-6 rounded-2xl border border-ink-800 bg-ink-900/50 hover:border-gold-500/30 transition-all">
                  <div className="font-display text-4xl font-bold text-gold-500/20 mb-4">{s.num}</div>
                  <h3 className="font-display text-lg font-semibold text-ink-100 mb-2">{s.title}</h3>
                  <p className="text-ink-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Borrowers & Lenders */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Borrowers */}
          <div className="p-8 rounded-2xl border border-sapphire-500/20 bg-sapphire-500/5">
            <div className="w-12 h-12 rounded-xl bg-sapphire-500/10 border border-sapphire-500/20 flex items-center justify-center mb-6">
              <span className="text-2xl">🙋</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-ink-100 mb-4">For Borrowers</h3>
            <ul className="space-y-3 mb-8">
              {['Get loans from ₹10,000 to ₹10 Lakhs', 'Competitive interest rates from 10-18%',
                'Flexible tenure from 3-24 months', 'No hidden charges or prepayment fees',
                'Digital loan agreement with EMI schedule'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-ink-300">
                  <span className="text-emerald-400 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sapphire-500/10 border border-sapphire-500/20 text-sapphire-400 text-sm font-medium hover:bg-sapphire-500/20 transition-all">
              Apply for Loan →
            </Link>
          </div>

          {/* Lenders */}
          <div className="p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <span className="text-2xl">💼</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-ink-100 mb-4">For Lenders</h3>
            <ul className="space-y-3 mb-8">
              {['Earn 12-18% returns on your investments', 'Set your own lending preferences',
                'Choose borrowers based on credit score', 'Monthly EMI payments directly to wallet',
                'Full transparency with real-time tracking'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-ink-300">
                  <span className="text-emerald-400 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register?role=LENDER"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all">
              Start Lending →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl border border-gold-500/20 bg-gold-500/5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{background: 'radial-gradient(circle at 50% 50%, rgba(212,168,83,0.08) 0%, transparent 70%)'}} />
            <div className="relative">
              <h2 className="font-display text-4xl font-bold text-ink-100 mb-4">
                Ready to bridge the gap?
              </h2>
              <p className="text-ink-400 text-lg mb-8">
                Join thousands of borrowers and lenders on India's most transparent P2P platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="px-8 py-4 rounded-xl bg-gold-500 text-ink-950 font-display font-bold text-lg hover:bg-gold-400 transition-all hover:scale-105">
                  Create Free Account
                </Link>
                <Link to="/login"
                  className="px-8 py-4 rounded-xl border border-ink-700 text-ink-200 font-medium text-lg hover:border-gold-500/50 transition-all">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gold-500 flex items-center justify-center">
              <span className="text-ink-950 text-xs font-display font-bold">LB</span>
            </div>
            <span className="font-display font-bold text-ink-400 text-sm">LendBridge</span>
          </div>
          <p className="text-ink-500 text-xs">
            © 2025 LendBridge. Built for transparent P2P lending in India.
          </p>
          <div className="flex gap-6">
            <Link to="/login" className="text-ink-500 hover:text-ink-300 text-xs transition-colors">Sign In</Link>
            <Link to="/register" className="text-ink-500 hover:text-ink-300 text-xs transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}