import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth.service'
import { cn, getInitials } from '@/lib/utils'
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
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
        setProfileDetails({
          name: user?.name,
          email: user?.email,
          role: user?.role,
          dairyName: 'Milk Admin Platform',
        })
      } finally {
        setLoadingProfile(false)
      }
    }
  }

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      activeMatch: (pathname: string) =>
        pathname === '/dashboard' || pathname === '/',
    },
    {
      name: 'Distributors',
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
        pathname === '/customers' || pathname.startsWith('/customers/'),
    },
    {
      name: 'Transactions',
      path: '/transactions',
      icon: Receipt,
      activeMatch: (pathname: string) =>
        pathname === '/transactions' || pathname === '/billing',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8F7FB] text-[#192342] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="flex h-16 items-center justify-between border-b border-[#EAE9F2] bg-white px-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4768E8] font-bold text-white shadow-sm">
            M
          </div>
          <div>
            <div className="text-sm font-bold leading-none text-[#192342]">
              Milk Admin Panel
            </div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              PLATFORM OWNER
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenProfile}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF2FE] text-xs font-bold text-[#4768E8]"
            title="View Profile"
          >
            {getInitials(user?.name || user?.email || 'Admin')}
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
              M
            </div>
            <div>
              <div className="text-base font-bold leading-tight text-[#192342]">
                Milk Admin Panel
              </div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                PLATFORM OWNER PORTAL
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="mt-8">
            <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              MANAGEMENT
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
              title="Click to view administrator profile"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF2FE] text-xs font-bold text-[#4768E8]">
                {getInitials(user?.name || user?.email || 'Admin')}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-[#192342]">
                  {user?.name || 'Platform Admin'}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {user?.email || 'admin@milkmanagement.com'}
                </p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-[#DE3C4B] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl">
        <Outlet />
      </main>

      {/* Profile Details Dialog Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE9F2] pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#4768E8]" />
                <h3 className="text-base font-bold text-[#192342]">Administrator Profile</h3>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingProfile ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div className="flex items-center gap-3 rounded-xl bg-[#EFF2FE] p-3 text-[#4768E8]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-bold text-[#4768E8] shadow-sm">
                    {getInitials(profileDetails?.name || user?.name || 'Admin')}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#192342]">
                      {profileDetails?.name || user?.name || 'Platform Administrator'}
                    </div>
                    <div className="text-[11px] font-semibold text-[#4768E8] uppercase">
                      ROLE: {profileDetails?.role || user?.role || 'SUPER_ADMIN'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-lg border border-[#EAE9F2] p-2.5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>Email Address</span>
                    </div>
                    <div className="font-semibold text-[#192342]">
                      {profileDetails?.email || user?.email}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[#EAE9F2] p-2.5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>Mobile Number</span>
                    </div>
                    <div className="font-semibold text-[#192342]">
                      {profileDetails?.phoneNumber || user?.phoneNumber || 'Not configured'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[#EAE9F2] p-2.5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span>Authorization Level</span>
                    </div>
                    <div className="font-bold text-[#1E8E42] uppercase">
                      AUTHORIZED PLATFORM OWNER
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setProfileModalOpen(false)}
                    className="rounded-xl border border-[#EAE9F2] px-4 py-2 text-xs font-semibold text-[#192342] hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl bg-[#DE3C4B] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
