import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn, getInitials } from '@/lib/utils'
import {
  Menu,
  X,
  LogOut,
  Building2,
  Users,
  Receipt,
} from 'lucide-react'

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    {
      name: 'Distributor',
      path: '/distributors',
      icon: Building2,
      activeMatch: (pathname: string) =>
        pathname === '/distributors' || pathname.startsWith('/distributors/'),
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: Users,
      activeMatch: (pathname: string) => pathname === '/customers',
    },
    {
      name: 'Billing',
      path: '/billing',
      icon: Receipt,
      activeMatch: (pathname: string) => pathname === '/billing',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8F7FB] text-[#192342] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="flex h-16 items-center justify-between border-b border-[#EAE9F2] bg-white px-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4768E8] font-bold text-white shadow-sm">
            D
          </div>
          <div>
            <div className="text-sm font-bold leading-none text-[#192342]">
              Distributor
            </div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400">
              ADMIN
            </div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-[#EAE9F2] bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col justify-between',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-6">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4768E8] font-bold text-white shadow-sm text-lg">
              D
            </div>
            <div>
              <div className="text-base font-bold leading-tight text-[#192342]">
                Distributor
              </div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                ADMIN
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="mt-8">
            <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              WORKSPACE
            </div>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = item.activeMatch(location.pathname)
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#EFF2FE] text-[#4768E8]'
                        : 'text-[#64748B] hover:bg-slate-50 hover:text-[#192342]'
                    )}
                  >
                    <span>{item.name}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Current User & Logout */}
        <div className="border-t border-[#EAE9F2] p-4">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF2FE] text-xs font-bold text-[#4768E8]">
                {getInitials(user?.dairyName || user?.email || 'Admin')}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-[#192342]">
                  {user?.dairyName || 'Distributor Admin'}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {user?.email || 'admin@milkmanagement.com'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-[#DE3C4B]"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
