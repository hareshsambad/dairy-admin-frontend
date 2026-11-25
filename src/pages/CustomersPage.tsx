import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminService } from '@/services/admin.service'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react'

interface CustomerRow {
  cid: string
  id: string
  uniqueNumber: string
  name: string
  phoneNumber: string
  liters: number
  price: number
  isActive: boolean
  distributor: {
    did: string
    id: string
    dairyName: string
  }
}

export function CustomersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialDistributorId = searchParams.get('distributorId') || ''

  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [distributors, setDistributors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedDistributorId, setSelectedDistributorId] = useState(initialDistributorId)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [custList, distList] = await Promise.all([
        adminService.getCustomers({
          distributorId: selectedDistributorId || undefined,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        adminService.getDistributors(),
      ])
      setCustomers(Array.isArray(custList) ? custList : [])
      setDistributors(Array.isArray(distList) ? distList : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
  }, [selectedDistributorId, searchTerm, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 250)
    return () => clearTimeout(timer)
  }, [loadData])

  const stats = useMemo(() => {
    const total = customers.length
    const active = customers.filter((c) => c.isActive).length
    const inactive = total - active
    const totalDailyLiters = customers.reduce((sum, c) => sum + (c.liters || 0), 0)
    return {
      total,
      active,
      inactive,
      totalDailyLiters: Math.round((totalDailyLiters + Number.EPSILON) * 100) / 100,
    }
  }, [customers])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Platform Customers' }]} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
            Customer Directory
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            System-wide customer registry across all milk distributors. Inspect delivery profiles, milk volumes, and customer billing histories.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#EAE9F2] bg-white px-4 py-2 text-xs font-semibold text-[#192342] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Customers
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={stats.total.toString()}
          subtitle="Registered across dairies"
          icon={<Users className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="Active Customers"
          value={stats.active.toString()}
          subtitle="Currently active"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="green"
          badgeText="Receiving Milk"
          badgeVariant="success"
        />
        <StatCard
          title="Inactive Customers"
          value={stats.inactive.toString()}
          subtitle="Deactivated records"
          icon={<XCircle className="h-5 w-5" />}
          iconColor="red"
          badgeText={stats.inactive > 0 ? `${stats.inactive} Inactive` : undefined}
          badgeVariant="danger"
        />
        <StatCard
          title="Daily Volume"
          value={`${stats.totalDailyLiters.toFixed(2)} L`}
          subtitle="Agreed daily distribution"
          icon={<Building2 className="h-5 w-5" />}
          iconColor="purple"
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#EAE9F2] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, unique number, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#EAE9F2] bg-[#F8F7FB] py-2 pl-10 pr-4 text-xs text-[#192342] placeholder-slate-400 focus:border-[#4768E8] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Distributor Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedDistributorId}
              onChange={(e) => {
                setSelectedDistributorId(e.target.value)
                if (e.target.value) {
                  setSearchParams({ distributorId: e.target.value })
                } else {
                  setSearchParams({})
                }
              }}
              className="rounded-xl border border-[#EAE9F2] bg-[#F8F7FB] px-3 py-1.5 text-xs font-semibold text-[#192342] focus:border-[#4768E8] focus:bg-white focus:outline-none"
            >
              <option value="">All Distributors</option>
              {distributors.map((d) => (
                <option key={d.did} value={d.did}>
                  {d.dairyName}
                </option>
              ))}
            </select>
          </div>

          {/* Status buttons */}
          <div className="flex items-center gap-1 rounded-xl bg-[#F8F7FB] p-1 border border-[#EAE9F2]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-white text-[#192342] shadow-sm'
                  : 'text-slate-600 hover:text-[#192342]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === 'active'
                  ? 'bg-[#1E8E42] text-white'
                  : 'text-slate-600 hover:text-[#192342]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === 'inactive'
                  ? 'bg-[#DE3C4B] text-white'
                  : 'text-slate-600 hover:text-[#192342]'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-[#DE3C4B]">
          {error}
        </div>
      )}

      {/* Customer List Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EAE9F2] bg-white shadow-sm">
        {isLoading && customers.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-[#192342]">No customers found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm || selectedDistributorId || statusFilter !== 'all'
                ? 'Try resetting your filter or search query.'
                : 'No customers have been registered by distributors yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EAE9F2] bg-[#F8F7FB] text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Associated Distributor</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">Daily Volume</th>
                  <th className="px-6 py-3.5">Milk Rate</th>
                  <th className="px-6 py-3.5">Balance Status</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE9F2]">
                {customers.map((c) => (
                  <tr
                    key={c.cid}
                    onClick={() => navigate(`/customers/${c.cid}`)}
                    className="cursor-pointer transition hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EFF2FE] font-bold text-[#4768E8]">
                          #{c.uniqueNumber}
                        </div>
                        <div>
                          <div className="font-bold text-[#192342]">{c.name}</div>
                          <div className="text-[11px] text-slate-400">ID: {c.cid.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#4768E8]">
                        {c.distributor?.dairyName || 'Unknown Dairy'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {c.phoneNumber || '—'}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {c.liters.toFixed(2)} L / day
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      ₹{c.price.toFixed(2)} / L
                    </td>

                    <td className="px-6 py-4">
                      {Number((c as any).netBalanceDue ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEECEE] px-2.5 py-0.5 text-[11px] font-bold text-[#DE3C4B]">
                          Due: ₹{Number((c as any).netBalanceDue).toFixed(2)}
                        </span>
                      ) : Number((c as any).netAdvance ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#1E8E42]">
                          Advance: ₹{Number((c as any).netAdvance).toFixed(2)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          Settled (₹0)
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          c.isActive
                            ? 'bg-[#EBF7EE] text-[#1E8E42]'
                            : 'bg-[#FEECEE] text-[#DE3C4B]'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            c.isActive ? 'bg-[#1E8E42]' : 'bg-[#DE3C4B]'
                          }`}
                        />
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4768E8]">
                        <span>Inspect</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
