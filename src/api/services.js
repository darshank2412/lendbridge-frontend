import api from './client'

/* ─── OTP / Auth ─────────────────────────────────────────────── */
export const sendOtp = (data) => api.post('/auth/otp/send', data)
export const verifyOtp = (data) => api.post('/auth/otp/verify', data)

/* ─── Registration ───────────────────────────────────────────── */
export const register = (userId, data) =>
  api.post(`/register?userId=${userId}`, data)

/* ─── User / Profile ─────────────────────────────────────────── */
export const getMyProfile = () => api.get('/me')
export const updateProfile = (data) => api.put('/me', data)

/* ─── Admin User Management ─────────────────────────────────── */
export const getAllAdmins = () => api.get('/admin')
export const createAdmin = (data) => api.post('/admin', data)
export const deleteAdmin = (id) => api.delete(`/admin/${id}`)

/* ─── KYC ────────────────────────────────────────────────────── */
export const submitKyc = (userId, data) =>
  api.post(`/kyc/submit?userId=${userId}`, data)
export const getKycDocuments = (userId) => api.get(`/kyc/${userId}`)
export const approveKyc = (docId) => api.patch(`/kyc/approve/${docId}`)
export const rejectKyc = (docId, reason) =>
  api.patch(`/kyc/reject/${docId}?reason=${encodeURIComponent(reason)}`)

/* ─── Savings Products ───────────────────────────────────────── */
export const getSavingsProducts = () => api.get('/savings-products')
export const getSavingsProduct = (id) => api.get(`/savings-products/${id}`)
export const createSavingsProduct = (data) => api.post('/savings-products', data)
export const updateSavingsProduct = (id, data) => api.put(`/savings-products/${id}`, data)
export const deactivateSavingsProduct = (id) => api.delete(`/savings-products/${id}`)

/* ─── Loan Products ──────────────────────────────────────────── */
export const getLoanProducts = () => api.get('/loan-products')
export const getLoanProduct = (id) => api.get(`/loan-products/${id}`)
export const createLoanProduct = (data) => api.post('/loan-products', data)
export const updateLoanProduct = (id, data) => api.put(`/loan-products/${id}`, data)
export const deactivateLoanProduct = (id) => api.delete(`/loan-products/${id}`)

/* ─── Bank Accounts ──────────────────────────────────────────── */
export const openSavingsAccount = (data) => api.post('/accounts/savings', data)
export const openLoanAccount = (data) => api.post('/accounts/loan', data)
export const getAccount = (accountId) => api.get(`/accounts/${accountId}`)
export const getUserAccounts = (userId) => api.get(`/accounts/user/${userId}`)
export const deposit = (accountId, data) => api.post(`/accounts/${accountId}/deposit`, data)
export const withdraw = (accountId, data) => api.post(`/accounts/${accountId}/withdraw`, data)

/* ─── Lender Preferences ─────────────────────────────────────── */
export const savePreference = (lenderId, data) =>
  api.post(`/lender-preferences?lenderId=${lenderId}`, data)
export const getMyPreferences = (lenderId) =>
  api.get(`/lender-preferences/my?lenderId=${lenderId}`)
export const getAllPreferences = () => api.get('/lender-preferences')
export const deactivatePreference = (lenderId, loanProductId) =>
  api.patch(`/lender-preferences/deactivate?lenderId=${lenderId}&loanProductId=${loanProductId}`)

/* ─── Loan Requests ──────────────────────────────────────────── */
export const createLoanRequest = (borrowerId, data) =>
  api.post(`/loan-requests?borrowerId=${borrowerId}`, data)
export const getMyLoanRequests = (borrowerId) =>
  api.get(`/loan-requests/my?borrowerId=${borrowerId}`)
export const cancelLoanRequest = (requestId, borrowerId) =>
  api.patch(`/loan-requests/${requestId}/cancel?borrowerId=${borrowerId}`)
export const getOpenRequests = (lenderId) =>
  api.get(`/loan-requests/open?lenderId=${lenderId}`)
export const getMatchingRequests = (lenderId) =>
  api.get(`/loan-requests/open/matching?lenderId=${lenderId}`)
export const getMatchedRequests = () => api.get('/loan-requests/matched')
export const acceptLoanRequest = (requestId, lenderId) =>
  api.patch(`/loan-requests/${requestId}/accept?lenderId=${lenderId}`)
export const getAllLoanRequests = (status) =>
  api.get(`/loan-requests${status ? `?status=${status}` : ''}`)
export const getLoanRequest = (requestId) => api.get(`/loan-requests/${requestId}`)
export const matchLoanRequest = (requestId) =>
  api.patch(`/loan-requests/${requestId}/match`)
export const rejectLoanRequest = (requestId, reason) =>
  api.patch(`/loan-requests/${requestId}/reject?reason=${encodeURIComponent(reason)}`)

/* ─── Week 5+ — Disbursement & EMI (new endpoints) ──────────── */
export const disburseLoan = (requestId) =>
  api.post(`/disbursements/${requestId}`)
export const getEmiSchedule = (loanId) =>
  api.get(`/emi-schedule/${loanId}`)
export const payEmi = (emiId) =>
  api.post(`/repayments/${emiId}/pay`)
export const getLoanSummary = (loanId) =>
  api.get(`/loans/${loanId}/summary`)
export const earlyRepayment = (loanId) =>
  api.post(`/repayments/${loanId}/early-close`)

/* ─── Week 7 — Credit Score ──────────────────────────────────── */
export const getCreditScore = (userId) =>
  api.get(`/credit-score/${userId}`)

/* ─── Week 7 — Loan State Machine ───────────────────────────── */
export const getLoanStateMachine = (loanId) =>
  api.get(`/loans/${loanId}/state-history`)
export const getActiveLoan = (borrowerId) =>
  api.get(`/loans/active?borrowerId=${borrowerId}`)

/* ─── Week 7 — Repayments (partial + early) ──────────────────── */
export const payEmiInstalment = (loanId, emiNumber) =>
  api.post(`/repayments/${loanId}/pay-emi`, { emiNumber })
export const makePartialRepayment = (loanId, data) =>
  api.post(`/repayments/${loanId}/partial`, data)
export const makeEarlyClosureRepayment = (loanId, data) =>
  api.post(`/repayments/${loanId}/early-close`, data)
export const getEarlyClosureQuote = (loanId) =>
  api.get(`/repayments/${loanId}/early-close-quote`)
export const getRepaymentHistory = (loanId) =>
  api.get(`/repayments/${loanId}/history`)

/* ─── Week 7 — Paginated list endpoints ─────────────────────── */
export const getLoanRequestsPaginated = (params) =>
  api.get('/loan-requests/paginated', { params })
export const getLoanProductsPaginated = (params) =>
  api.get('/loan-products/paginated', { params })
export const getBorrowerLoansPaginated = (borrowerId, params) =>
  api.get(`/loan-requests/my/paginated?borrowerId=${borrowerId}`, { params })

/* ─── Week 8 — Analytics (Admin) ────────────────────────────── */
export const getPlatformStats = () =>
  api.get('/analytics/platform-stats')
export const getDisbursementTrend = (months) =>
  api.get(`/analytics/disbursement-trend?months=${months}`)
export const getRepaymentHealth = () =>
  api.get('/analytics/repayment-health')
