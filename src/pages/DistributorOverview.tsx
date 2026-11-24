import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/admin.service'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  Search,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  Power,
  Calendar,
} from 'lucide-react'

interface DistributorItem {
  did: string
  id: string
  dairyName: string
  isActive: boolean
  createdAt: string | null
  user: {
    uid: string
    name: string
    email: string
    phoneNumber: string
    isActive: boolean
  }
  customerCount: number
  activeCustomerCount: number
}

export function DistributorOverview() {
  const navigate = useNavigate()
  const [distributors, setDistributors] = useState<DistributorItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchDistributors = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminService.getDistributors(
        searchTerm || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      )
      setDistributors(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch distributors')
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDistributors()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchDistributors])

  const handleToggleStatus = async (dist: DistributorItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = !dist.isActive
    const actionText = newStatus ? 'activate' : 'deactivate'
    const confirmMessage = newStatus
      ? `Are you sure you want to activate "${dist.dairyName}"?`
      : `Are you sure you want to deactivate "${dist.dairyName}"? All its associated customers will also be deactivated.`

    if (!window.confirm(confirmMessage)) return

    setUpdatingId(dist.did)
    try {
      await adminService.updateDistributorStatus(dist.did, newStatus)
      await fetchDistributors()
    } catch (err: any) {
      alert(err?.response?.data?.message || `Failed to ${actionText} distributor`)
    } finally {
      setUpdatingId(null)
    }
  }

  const stats = useMemo(() => {
    const total = distributors.length
    const active = distributors.filter((d) => d.isActive).length
    const inactive = total - active
    const totalCustomers = distributors.reduce((sum, d) => sum + (d.customerCount || 0), 0)
    return { total, active, inactive, totalCustomers }
  }, [distributors])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Distributor Management' }]} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
            Distributor Management
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Review all registered milk distributors, manage their account statuses, and inspect individual dairy operations.
          </p>
        </div>

        <button
          onClick={fetchDistributors}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#EAE9F2] bg-white px-4 py-2 text-xs font-semibold text-[#192342] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registered"
          value={stats.total.toString()}
          subtitle="Distributors on platform"
          icon={<Building2 className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="Active Dairies"
          value={stats.active.toString()}
          subtitle="Currently operational"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="green"
          badgeText="Active"
          badgeVariant="success"
        />
        <StatCard
          title="Inactive Dairies"
          value={stats.inactive.toString()}
          subtitle="Deactivated accounts"
          icon={<XCircle className="h-5 w-5" />}
          iconColor="red"
          badgeText={stats.inactive > 0 ? `${stats.inactive} Inactive` : undefined}
          badgeVariant="danger"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toString()}
          subtitle="Across all distributors"
          icon={<Users className="h-5 w-5" />}
          iconColor="teal"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#EAE9F2] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by dairy name, owner name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#EAE9F2] bg-[#F8F7FB] py-2 pl-10 pr-4 text-xs text-[#192342] placeholder-slate-400 focus:border-[#4768E8] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-[#192342] text-white'
                : 'bg-[#F8F7FB] text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({distributors.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'active'
                ? 'bg-[#1E8E42] text-white'
                : 'bg-[#EBF7EE] text-[#1E8E42] hover:bg-green-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'inactive'
                ? 'bg-[#DE3C4B] text-white'
                : 'bg-[#FEECEE] text-[#DE3C4B] hover:bg-red-100'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-[#DE3C4B]">
          {error}
        </div>
      )}

      {/* Distributors Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EAE9F2] bg-white shadow-sm">
        {isLoading && distributors.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
          </div>
        ) : distributors.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-[#192342]">No distributors found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search query or filter options.'
                : 'No distributors have registered on the platform yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EAE9F2] bg-[#F8F7FB] text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Dairy & Business</th>
                  <th className="px-6 py-3.5">Owner Contact</th>
                  <th className="px-6 py-3.5">Customers</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Registration</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE9F2]">
                {distributors.map((dist) => {
                  const isUpdating = updatingId === dist.did
                  return (
                    <tr
                      key={dist.did}
                      onClick={() => navigate(`/distributors/${dist.did}`)}
                      className="cursor-pointer transition hover:bg-slate-50/80"
                    >
                      {/* Dairy name & ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF2FE] font-bold text-[#4768E8]">
                            {dist.dairyName.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#192342]">{dist.dairyName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: {dist.did.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner contact */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#192342]">{dist.user.name}</div>
                        <div className="text-[11px] text-slate-500">{dist.user.email}</div>
                        {dist.user.phoneNumber && (
                          <div className="text-[11px] text-slate-400">{dist.user.phoneNumber}</div>
                        )}
                      </td>

                      {/* Customers count */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#EFF2FE] px-2.5 py-1 text-xs font-semibold text-[#4768E8]">
                          <Users className="h-3.5 w-3.5" />
                          <span>{dist.customerCount} customers</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {dist.activeCustomerCount} active
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              dist.isActive
                                ? 'bg-[#EBF7EE] text-[#1E8E42]'
                                : 'bg-[#FEECEE] text-[#DE3C4B]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                dist.isActive ? 'bg-[#1E8E42]' : 'bg-[#DE3C4B]'
                              }`}
                            />
                            {dist.isActive ? 'Active' : 'Inactive'}
                          </span>

                          <button
                            onClick={(e) => handleToggleStatus(dist, e)}
                            disabled={isUpdating}
                            title={dist.isActive ? 'Deactivate account' : 'Activate account'}
                            className={`rounded-lg p-1 transition ${
                              dist.isActive
                                ? 'text-slate-400 hover:bg-red-50 hover:text-[#DE3C4B]'
                                : 'text-slate-400 hover:bg-green-50 hover:text-[#1E8E42]'
                            }`}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#4768E8]" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {dist.createdAt ? dist.createdAt.slice(0, 10) : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4768E8] group-hover:underline">
                          <span>Inspect</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
