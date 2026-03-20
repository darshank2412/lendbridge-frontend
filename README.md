# LendBridge — Micro Lending Platform Frontend
### Complete — Weeks 1 through 8

## Quick Start

```bash
npm install
npm run dev           # → http://localhost:5173 (proxies /api → localhost:8081)
npm test              # Run all 40+ tests
npm run test:coverage # Coverage report
```

## Week 7 — Stretch Goals (new in this release)

| Feature | Route | Notes |
|---------|-------|-------|
| Credit score with gauge + breakdown | /borrower/credit-score, /lender/credit-score | Falls back to computed score if API not wired |
| Loan state machine visualizer | /admin/state-machine | Click any state, full transition table |
| Partial repayment | /borrower/repayments | POST /repayments/{id}/partial |
| Early closure with penalty quote | /borrower/repayments | GET quote + POST close |
| Pagination hook | src/hooks/usePagination.js | usePagination() + PaginationBar component |
| Global error toasts + ErrorBoundary | src/components/ui/ErrorHandling.jsx | useToast(), parseApiError(), ErrorBoundary |
| Platform analytics charts | /admin/analytics | Recharts: area, pie, bar |

## Week 8 — Testing + Documentation (new in this release)

| Feature | Location |
|---------|----------|
| 40+ Vitest frontend tests | src/tests/platform.test.js |
| Vitest config + v8 coverage | vitest.config.js |
| JUnit5 + Testcontainers backend templates | src/tests/BACKEND_TESTS.java |
| Full API documentation viewer | /admin/api-docs |

## Full Project Structure

```
src/
├── api/client.js            Axios + Basic/JWT interceptor
├── api/services.js          All 50+ endpoints (Wks 1-8)
├── store/authStore.js       Zustand auth state
├── hooks/usePagination.js   Generic pagination hook
├── utils/emi.js             EMI, amortization, formatINR
├── components/ui/
│   ├── index.jsx            Spinner, Modal, Table, Badge, Card...
│   └── ErrorHandling.jsx    Toast, ErrorBoundary, parseApiError
├── components/shared/
│   ├── Sidebar.jsx          All 3 roles, all nav items
│   ├── DashboardLayout.jsx
│   └── ProtectedRoute.jsx
└── pages/
    ├── auth/                Login, Register (OTP 3-step)
    ├── borrower/            Dashboard, LoanRequests, NewRequest, Kyc,
    │                        Accounts, LenderPreferences, Repayments
    ├── lender/              Dashboard, Preferences, Requests
    ├── admin/               Dashboard, Analytics, LoanRequests,
    │                        Kyc, Products, Users
    └── shared/              Profile, CreditScore, StateMachine, ApiDocs
```

## EMI Formula

```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)   where r = annualRate/12/100
Early closure penalty = outstanding × penaltyRate / 100
```

## Week 6 — JWT Migration

When backend returns JWT tokens, update Login/Register success handler:
```js
login({ user, token: res.data.data.token })
// Axios interceptor auto-switches from Basic Auth → Bearer
```

## Backend Endpoints to Wire (Week 5+)

Already stubbed in src/api/services.js:
- POST /disbursements/{requestId}
- GET  /emi-schedule/{loanId}
- POST /repayments/{loanId}/pay-emi
- POST /repayments/{loanId}/partial
- GET  /repayments/{loanId}/early-close-quote
- POST /repayments/{loanId}/early-close
- GET  /credit-score/{userId}
- GET  /loans/{loanId}/state-history
