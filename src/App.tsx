import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from './pages/Login'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { DistributorOverview } from './pages/DistributorOverview'
import { DistributorDetail } from './pages/DistributorDetail'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerProfilePage } from './pages/CustomerProfilePage'
import { BillingPage } from './pages/BillingPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4768E8] border-t-transparent" />
          <p className="text-xs text-slate-500">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/distributors" replace />} />
        <Route path="distributors" element={<DistributorOverview />} />
        <Route path="distributors/:id" element={<DistributorDetail />} />
        <Route path="distributors/:distId/customers" element={<CustomersPage />} />
        <Route path="distributors/:distId/customers/:id" element={<CustomerProfilePage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerProfilePage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
