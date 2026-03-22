import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { ToastProvider, ErrorBoundary } from './components/ui/ErrorHandling'

import LoginPage from './pages/auth/Login'
import RegisterPage from './pages/auth/Register'
import LandingPage from './pages/Landing'
import ProtectedRoute from './components/shared/ProtectedRoute'
import DashboardLayout from './components/shared/DashboardLayout'

// Borrower pages
import BorrowerDashboard from './pages/borrower/Dashboard'
import BorrowerLoanRequests from './pages/borrower/LoanRequests'
import NewLoanRequest from './pages/borrower/NewRequest'
import BorrowerKyc from './pages/borrower/Kyc'
import BorrowerAccounts from './pages/borrower/Accounts'
import LenderPreferencesBrowse from './pages/borrower/LenderPreferences'
import RepaymentsPage from './pages/borrower/Repayments'
import WalletPage from './pages/borrower/Wallet'

// Lender pages
import LenderDashboard from './pages/lender/Dashboard'
import LenderPreferences from './pages/lender/Preferences'
import { LenderOpenRequests, LenderMatchingRequests, LenderMatchedRequests } from './pages/lender/Requests'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminLoanRequests from './pages/admin/LoanRequests'
import AdminKyc from './pages/admin/Kyc'
import { AdminLoanProducts, AdminSavingsProducts } from './pages/admin/Products'
import AdminUsers from './pages/admin/Users'
import AdminAnalytics from './pages/admin/Analytics'

// Shared pages
import { ProfilePage, AdminPreferences } from './pages/shared/Profile'
import CreditScorePage from './pages/shared/CreditScore'
import LoanStateMachine from './pages/shared/StateMachine'
import ApiDocsPage from './pages/shared/ApiDocs'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function RootRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role.toLowerCase()}`} replace />
}

const wrap = (roles, Page) => (
  <ProtectedRoute allowedRoles={roles}>
    <DashboardLayout><Page /></DashboardLayout>
  </ProtectedRoute>
)

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Borrower */}
              <Route path="/borrower"                    element={wrap(['BORROWER'], BorrowerDashboard)} />
              <Route path="/borrower/loan-requests"      element={wrap(['BORROWER'], BorrowerLoanRequests)} />
              <Route path="/borrower/new-request"        element={wrap(['BORROWER'], NewLoanRequest)} />
              <Route path="/borrower/kyc"                element={wrap(['BORROWER'], BorrowerKyc)} />
              <Route path="/borrower/accounts"           element={wrap(['BORROWER'], BorrowerAccounts)} />
              <Route path="/borrower/wallet"             element={wrap(['BORROWER'], WalletPage)} />
              <Route path="/borrower/lender-preferences" element={wrap(['BORROWER'], LenderPreferencesBrowse)} />
              <Route path="/borrower/repayments"         element={wrap(['BORROWER'], RepaymentsPage)} />
              <Route path="/borrower/credit-score"       element={wrap(['BORROWER'], CreditScorePage)} />
              <Route path="/borrower/profile"            element={wrap(['BORROWER'], ProfilePage)} />

              {/* Lender */}
              <Route path="/lender"               element={wrap(['LENDER'], LenderDashboard)} />
              <Route path="/lender/preferences"   element={wrap(['LENDER'], LenderPreferences)} />
              <Route path="/lender/open-requests" element={wrap(['LENDER'], LenderOpenRequests)} />
              <Route path="/lender/matching"      element={wrap(['LENDER'], LenderMatchingRequests)} />
              <Route path="/lender/matched"       element={wrap(['LENDER'], LenderMatchedRequests)} />
              <Route path="/lender/accounts"      element={wrap(['LENDER'], BorrowerAccounts)} />
              <Route path="/lender/wallet"        element={wrap(['LENDER'], WalletPage)} />
              <Route path="/lender/credit-score"  element={wrap(['LENDER'], CreditScorePage)} />
              <Route path="/lender/profile"       element={wrap(['LENDER'], ProfilePage)} />

              {/* Admin */}
              <Route path="/admin"                  element={wrap(['ADMIN'], AdminDashboard)} />
              <Route path="/admin/analytics"        element={wrap(['ADMIN'], AdminAnalytics)} />
              <Route path="/admin/loan-requests"    element={wrap(['ADMIN'], AdminLoanRequests)} />
              <Route path="/admin/kyc"              element={wrap(['ADMIN'], AdminKyc)} />
              <Route path="/admin/loan-products"    element={wrap(['ADMIN'], AdminLoanProducts)} />
              <Route path="/admin/savings-products" element={wrap(['ADMIN'], AdminSavingsProducts)} />
              <Route path="/admin/users"            element={wrap(['ADMIN'], AdminUsers)} />
              <Route path="/admin/preferences"      element={wrap(['ADMIN'], AdminPreferences)} />
              <Route path="/admin/state-machine"    element={wrap(['ADMIN'], LoanStateMachine)} />
              <Route path="/admin/api-docs"         element={wrap(['ADMIN'], ApiDocsPage)} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}