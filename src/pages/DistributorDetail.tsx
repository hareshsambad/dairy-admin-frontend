import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/admin.service'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import { formatCompactINR, formatINR } from '@/lib/utils'
import type { DistributorDetailData } from '@/types'
import {
  ArrowLeft,
  ArrowRight,
  Users,
  IndianRupee,
  Droplets,
  Loader2,
  Mail,
  Phone,
  Power,
} from 'lucide-react'

export function DistributorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<DistributorDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadDetails = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getDistributorDetails(id)
      setData(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load distributor details')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  const handleToggleStatus = async () => {
    if (!data?.distributor) return
    const newStatus = !data.distributor.isActive
    const actionText = newStatus ? 'activate' : 'deactivate'
    const confirmMessage = newStatus
      ? `Are you sure you want to activate "${data.distributor.dairyName}"?`
      : `Are you sure you want to deactivate "${data.distributor.dairyName}"? All its associated customers will also be deactivated.`

    if (!window.confirm(confirmMessage)) return

    setIsUpdatingStatus(true)
    try {
      await adminService.updateDistributorStatus(data.distributor.did, newStatus)
      await loadDetails()
    } catch (err: any) {
      alert(err?.response?.data?.message || `Failed to ${actionText} distributor`)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#4768E8]" />
          <p className="text-xs text-slate-500 font-medium">Loading distributor details from database...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Distributors', href: '/distributors' }, { label: 'Details' }]} />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="text-sm font-bold text-[#DE3C4B]">{error || 'Distributor not found'}</h3>
          <p className="mt-1 text-xs text-slate-600">The requested distributor could not be loaded.</p>
          <div className="mt-4">
            <Link
              to="/distributors"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#192342] px-4 py-2 text-xs font-semibold text-white shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Distributors
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { distributor, overview, customers } = data
  const distUser = distributor.user

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Distributor Management', href: '/distributors' },
          { label: distributor.dairyName },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
              {distributor.dairyName}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                distributor.isActive
                  ? 'bg-[#EBF7EE] text-[#1E8E42]'
                  : 'bg-[#FEECEE] text-[#DE3C4B]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  distributor.isActive ? 'bg-[#1E8E42]' : 'bg-[#DE3C4B]'
                }`}
              />
              {distributor.isActive ? 'Active Account' : 'Inactive'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Distributor ID: {distributor.did}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStatus}
            disabled={isUpdatingStatus}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 ${
              distributor.isActive
                ? 'bg-[#DE3C4B] hover:bg-red-700'
                : 'bg-[#1E8E42] hover:bg-green-700'
            }`}
          >
            {isUpdatingStatus ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            {distributor.isActive ? 'Deactivate Dairy' : 'Activate Dairy'}
          </button>

          <Link
            to="/distributors"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE9F2] bg-white px-4 py-2 text-xs font-semibold text-[#192342] shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to List
          </Link>
        </div>
      </div>

      {/* 4 KPI overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={overview.totalCustomers.toString()}
          subtitle={`${overview.activeCustomers} active`}
          icon={<Users className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="Milk Collected"
          value={`${overview.totalMilkLiters.toLocaleString('en-IN')} L`}
          subtitle={`Total revenue: ${formatCompactINR(overview.totalMilkAmount)}`}
          icon={<Droplets className="h-5 w-5" />}
          iconColor="purple"
        />
        <StatCard
          title="Payments Received"
          value={formatCompactINR(overview.totalPaymentsReceived)}
          subtitle="Collected payments"
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor="green"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatINR(overview.outstandingBalance)}
          subtitle="Net due from customers"
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor={overview.outstandingBalance > 0 ? 'red' : 'green'}
          badgeText={overview.outstandingBalance > 0 ? 'Due' : 'Settled'}
          badgeVariant={overview.outstandingBalance > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Distributor Info Card */}
      <div className="rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#192342]">Distributor Profile & Registration</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-[#F8F7FB] p-3.5">
            <div className="text-[11px] font-semibold text-slate-400">Business / Dairy Name</div>
            <div className="mt-1 font-bold text-[#192342]">{distributor.dairyName}</div>
          </div>
          <div className="rounded-xl bg-[#F8F7FB] p-3.5">
            <div className="text-[11px] font-semibold text-slate-400">Owner Name</div>
            <div className="mt-1 font-bold text-[#192342]">{distUser.name}</div>
          </div>
          <div className="rounded-xl bg-[#F8F7FB] p-3.5">
            <div className="text-[11px] font-semibold text-slate-400">Registered Email</div>
            <div className="mt-1 font-medium text-[#192342] flex items-center gap-1.5 truncate">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{distUser.email}</span>
            </div>
          </div>
          <div className="rounded-xl bg-[#F8F7FB] p-3.5">
            <div className="text-[11px] font-semibold text-slate-400">Mobile Number</div>
            <div className="mt-1 font-medium text-[#192342] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{distUser.phoneNumber || 'Not provided'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Section */}
      <div className="rounded-2xl border border-[#EAE9F2] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#EAE9F2] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#192342]">
              Distributor Customers ({customers.length})
            </h2>
            <p className="text-xs text-slate-500">
              Customers registered and managed under {distributor.dairyName}. Select any customer to inspect detailed milk entries and bills.
            </p>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No customers have been registered by this distributor yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EAE9F2] bg-[#F8F7FB] text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Customer No.</th>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Mobile Number</th>
                  <th className="px-6 py-3.5">Daily Volume</th>
                  <th className="px-6 py-3.5">Agreed Price</th>
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
                    <td className="px-6 py-4 font-bold text-[#4768E8]">
                      #{c.uniqueNumber}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#192342]">
                      {c.name}
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
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          c.isActive
                            ? 'bg-[#EBF7EE] text-[#1E8E42]'
                            : 'bg-[#FEECEE] text-[#DE3C4B]'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4768E8]">
                        <span>Inspect Profile</span>
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
