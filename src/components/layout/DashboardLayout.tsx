import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth.service'
import { cn, getInitials } from '@/lib/utils'
import {
  Menu,
  X,
  LogOut,
  Building2,
  Users,
  Receipt,
  MessageSquare,
  Store,
  Mail,
  Phone,
  Shield,
  Loader2,
} from 'lucide-react'

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileDetails, setProfileDetails] = useState<{
    name?: string
    email?: string
    dairyName?: string
    phoneNumber?: string
    role?: string
  } | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleOpenProfile = async () => {
    setProfileModalOpen(true)
    if (!profileDetails) {
      setLoadingProfile(true)
      try {
        const data = await authService.getProfile()
        setProfileDetails(data)
      } catch {
        // Fallback to local user
        setProfileDetails({
          name: user?.name,
          email: user?.email,
          dairyName: user?.dairyName,
        })
      } finally {
        setLoadingProfile(false)
      }
    }
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
      activeMatch: (pathname: string) =>
        pathname === '/customers' || pathname.includes('/customers/'),
    },
    {
      name: 'Billing',
      path: '/billing',
      icon: Receipt,
      activeMatch: (pathname: string) => pathname === '/billing',
    },
    {
      name: 'Messaging',
      path: '/messages',
      icon: MessageSquare,
      activeMatch: (pathname: string) => pathname === '/messages',
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
              {user?.dairyName || 'Dairy Desk'}
            </div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400">
              MANAGEMENT
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenProfile}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF2FE] text-xs font-bold text-[#4768E8]"
            title="View Profile"
          >
            {getInitials(user?.dairyName || user?.email || 'Admin')}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation (Desktop) */}
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
                {user?.dairyName || 'Dairy Desk'}
              </div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                ADMIN WORKSPACE
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="mt-8">
            <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              SECTIONS
            </div>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = item.activeMatch(location.pathname)
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#EFF2FE] text-[#4768E8] font-semibold'
                        : 'text-[#64748B] hover:bg-slate-50 hover:text-[#192342]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Current User & Profile Access */}
        <div className="border-t border-[#EAE9F2] p-4">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5">
            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex items-center gap-2.5 overflow-hidden text-left hover:opacity-80 transition-opacity"
              title="Click to view full profile"
            >
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
            </button>

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
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-8 sm:py-8 md:pb-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>

      {/* Phase 2: Mobile Bottom Navigation Bar (Instant, responsive, zero-loader tab switching) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-[#EAE9F2] bg-white/95 backdrop-blur-md px-1 py-1 md:hidden shadow-lg">
        {navItems.map((item) => {
          const isActive = item.activeMatch(location.pathname)
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-all',
                isActive
                  ? 'text-[#4768E8] font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-all',
                  isActive ? 'bg-[#EFF2FE]' : 'bg-transparent'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] leading-tight">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Phase 9: View Profile Modal Dialog */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF2FE] text-lg font-bold text-[#4768E8]">
                {getInitials(profileDetails?.dairyName || profileDetails?.name || user?.email || 'Admin')}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#192342]">
                  {profileDetails?.name || user?.name || 'Dairy Owner'}
                </h3>
                <p className="text-xs text-[#64748B]">Account & Dairy Details</p>
              </div>
            </div>

            {loadingProfile ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
              </div>
            ) : (
              <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Store className="h-3.5 w-3.5 text-slate-400" />
                    Dairy Name
                  </span>
                  <span className="font-semibold text-slate-800">
                    {profileDetails?.dairyName || user?.dairyName || 'Dairy Desk'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Email
                  </span>
                  <span className="font-semibold text-slate-800">
                    {profileDetails?.email || user?.email || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    Phone
                  </span>
                  <span className="font-semibold text-slate-800">
                    {profileDetails?.phoneNumber || '+91 9104152524'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    Account Role
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                    {profileDetails?.role || user?.role || 'Distributor Admin'}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
