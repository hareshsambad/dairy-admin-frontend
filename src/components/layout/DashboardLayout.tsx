import { Outlet } from 'react-router-dom'
import { AdminHeader } from './AdminHeader'

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
