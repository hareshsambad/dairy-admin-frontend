import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { adminService } from '@/services/admin.service'
import { StatCard } from '@/components/dashboard/StatCard'
import { formatCompactINR, formatINR } from '@/lib/utils'
import type { PlatformStats } from '@/types'
import {
  Building2,
  Users,
  Droplets,
  IndianRupee,
  Receipt,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminService.getStats()
      setStats(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load platform statistics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EFF2FE] px-3 py-1 text-xs font-semibold text-[#4768E8]">
            <span className="h-2 w-2 rounded-full bg-[#4768E8]" />
            Platform Owner Portal
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
            Welcome back, {user?.name || user?.firstName || 'Platform Administrator'}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            System-wide overview of all milk distributors, customer networks, and business transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#EAE9F2] bg-white px-4 py-2 text-xs font-semibold text-[#192342] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Platform Data
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-[#DE3C4B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchStats} className="underline hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {isLoading && !stats ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-[#EAE9F2] bg-white">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#4768E8]" />
            <p className="text-xs text-slate-500 font-medium">Aggregating platform database statistics...</p>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Main 4 Platform KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Registered Distributors"
              value={stats.totalDistributors.toString()}
              subtitle={`${stats.activeDistributors} Active · ${stats.inactiveDistributors} Inactive`}
              icon={<Building2 className="h-5 w-5" />}
              iconColor="blue"
              badgeText={stats.activeDistributors > 0 ? `${stats.activeDistributors} Online` : undefined}
              badgeVariant="success"
            />

            <StatCard
              title="Platform Customers"
              value={stats.totalCustomers.toString()}
              subtitle={`${stats.activeCustomers} actively receiving milk`}
              icon={<Users className="h-5 w-5" />}
              iconColor="teal"
              badgeText="All Dairies"
              badgeVariant="neutral"
            />

            <StatCard
              title="Total Milk Collection"
              value={`${stats.totalMilkLiters.toLocaleString('en-IN')} L`}
              subtitle={`Valued at ${formatCompactINR(stats.totalMilkValue)}`}
              icon={<Droplets className="h-5 w-5" />}
              iconColor="purple"
              badgeText="Live Data"
              badgeVariant="success"
            />

            <StatCard
              title="Payments Received"
              value={formatCompactINR(stats.totalPaymentsReceived)}
              subtitle={`Outstanding: ${formatINR(stats.totalOutstandingAmount)}`}
              icon={<IndianRupee className="h-5 w-5" />}
              iconColor="green"
              badgeText={`${stats.totalTransactions} Transactions`}
              badgeVariant="neutral"
            />
          </div>

          {/* Platform Management Navigation Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              to="/distributors"
              className="group flex flex-col justify-between rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm transition-all hover:border-[#4768E8] hover:shadow-md"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF2FE] text-[#4768E8]">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#192342] group-hover:text-[#4768E8]">
                  Distributor Management
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Inspect all {stats.totalDistributors} registered dairies, review account status, activate or deactivate distributor operations.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#4768E8]">
                <span>Manage Distributors</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              to="/customers"
              className="group flex flex-col justify-between rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm transition-all hover:border-[#4768E8] hover:shadow-md"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F8F6] text-[#0D9488]">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#192342] group-hover:text-[#0D9488]">
                  Customer Database
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Access all {stats.totalCustomers} customers across all distributors, view delivery volumes, rates, and individual customer profiles.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#0D9488]">
                <span>Inspect Customers</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              to="/transactions"
              className="group flex flex-col justify-between rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm transition-all hover:border-[#4768E8] hover:shadow-md"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF7EE] text-[#1E8E42]">
                  <Receipt className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#192342] group-hover:text-[#1E8E42]">
                  Transactions & Billing
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Review global billing records, payment receipts, settlements, and track pending outstanding amounts across the platform.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#1E8E42]">
                <span>View Transactions</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {/* Recent Activity Table */}
          <div className="rounded-2xl border border-[#EAE9F2] bg-white shadow-sm overflow-hidden">
            <div className="border-b border-[#EAE9F2] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#192342]">Recent Platform Milk Collections</h2>
                <p className="text-xs text-slate-500">Live feed of milk records logged across all active dairy distributors.</p>
              </div>
              <Link to="/distributors" className="text-xs font-semibold text-[#4768E8] hover:underline">
                View All
              </Link>
            </div>

            {stats.recentActivity.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent milk collection entries found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F7FB] border-b border-[#EAE9F2] text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Quantity</th>
                      <th className="px-6 py-3">Rate</th>
                      <th className="px-6 py-3">Total Amount</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE9F2]">
                    {stats.recentActivity.map((activity) => (
                      <tr key={activity.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-3.5 font-medium text-[#192342]">
                          {activity.date}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-700">
                          {activity.liters.toFixed(2)} L
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          ₹{activity.price.toFixed(2)} / L
                        </td>
                        <td className="px-6 py-3.5 font-bold text-[#192342]">
                          {formatINR(activity.total)}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E8E42]">
                            <CheckCircle2 className="h-3 w-3" />
                            Recorded
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
