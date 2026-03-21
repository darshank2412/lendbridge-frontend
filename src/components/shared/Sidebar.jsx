import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const NAV = {
  BORROWER: [
    { to: '/borrower',                    label: 'Dashboard',        icon: '◈' },
    { to: '/borrower/loan-requests',      label: 'My Loan Requests', icon: '◩' },
    { to: '/borrower/new-request',        label: 'New Request',      icon: '⊕' },
    { to: '/borrower/lender-preferences', label: 'Browse Lenders',   icon: '◎' },
    { to: '/borrower/repayments',         label: 'Repayments',       icon: '💳' },
    { to: '/borrower/wallet',             label: 'Wallet',           icon: '₹' },
    { to: '/borrower/accounts',           label: 'My Accounts',      icon: '◫' },
    { to: '/borrower/kyc',                label: 'KYC',              icon: '◉' },
    { to: '/borrower/credit-score',       label: 'Credit Score',     icon: '★' },
    { to: '/borrower/profile',            label: 'Profile',          icon: '◌' },
  ],
  LENDER: [
    { to: '/lender',               label: 'Dashboard',         icon: '◈' },
    { to: '/lender/preferences',   label: 'My Preferences',    icon: '◉' },
    { to: '/lender/open-requests', label: 'Open Requests',     icon: '◩' },
    { to: '/lender/matching',      label: 'Matching Requests', icon: '◎' },
    { to: '/lender/matched',       label: 'Matched Requests',  icon: '◫' },
    { to: '/lender/wallet',        label: 'Wallet',            icon: '₹' },
    { to: '/lender/accounts',      label: 'My Accounts',       icon: '◌' },
    { to: '/lender/credit-score',  label: 'Credit Score',      icon: '★' },
    { to: '/lender/profile',       label: 'Profile',           icon: '◌' },
  ],
  ADMIN: [
    { to: '/admin',                   label: 'Dashboard',        icon: '◈' },
    { to: '/admin/analytics',         label: 'Analytics',        icon: '📊' },
    { to: '/admin/loan-requests',     label: 'Loan Requests',    icon: '◩' },
    { to: '/admin/kyc',               label: 'KYC Review',       icon: '◉' },
    { to: '/admin/loan-products',     label: 'Loan Products',    icon: '◫' },
    { to: '/admin/savings-products',  label: 'Savings Products', icon: '◎' },
    { to: '/admin/users',             label: 'Admins',           icon: '◌' },
    { to: '/admin/preferences',       label: 'Lender Prefs',     icon: '⚙' },
    { to: '/admin/state-machine',     label: 'State Machine',    icon: '⇄' },
    { to: '/admin/api-docs',          label: 'API Docs',         icon: '⚡' },
  ],
}

const ROLE_COLORS = {
  BORROWER: 'text-sapphire-400',
  LENDER:   'text-emerald-400',
  ADMIN:    'text-gold-400',
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = user?.role || 'BORROWER'
  const navItems = NAV[role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-ink-900 border-r border-ink-800 flex flex-col">
      <div className="px-5 py-6 border-b border-ink-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold-500 flex items-center justify-center">
            <span className="text-ink-950 text-xs font-display font-bold">LB</span>
          </div>
          <span className="font-display font-bold text-ink-100 text-lg">LendBridge</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-ink-700 flex items-center justify-center text-xs font-medium text-ink-300">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-200 truncate">{user?.fullName || user?.firstName}</p>
            <p className={clsx('text-xs', ROLE_COLORS[role])}>{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length === 2}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-ink-800">
        {user?.kycStatus && (
          <div className="px-3 py-2 mb-2 rounded-lg bg-ink-800/50 text-xs flex items-center justify-between">
            <span className="text-ink-400">KYC</span>
            <span className={clsx(
              user.kycStatus === 'VERIFIED' ? 'text-emerald-400' :
              user.kycStatus === 'REJECTED' ? 'text-ruby-400' : 'text-amber-400'
            )}>{user.kycStatus}</span>
          </div>
        )}
        <button onClick={handleLogout} className="nav-item w-full text-ruby-400 hover:bg-ruby-500/10">
          <span>⊗</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}