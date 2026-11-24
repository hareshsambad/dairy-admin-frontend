import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminService } from '@/services/admin.service'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import { formatINR } from '@/lib/utils'
import type { CustomerDetailData } from '@/types'
import {
  ArrowLeft,
  Users,
  IndianRupee,
  Droplets,
  Building2,
  Phone,
  Mail,
  Loader2,
  FileText,
  CreditCard,
} from 'lucide-react'

export function CustomerProfilePage() {
  const { id: customerParamId } = useParams<{ id: string }>()
  const [data, setData] = useState<CustomerDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'milk-history' | 'monthly-bills' | 'payments'>('milk-history')

  const loadCustomer = useCallback(async () => {
    if (!customerParamId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getCustomerDetails(customerParamId)
      setData(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load customer profile')
    } finally {
      setIsLoading(false)
    }
  }, [customerParamId])

  useEffect(() => {
    loadCustomer()
  }, [loadCustomer])

  if (isLoading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#4768E8]" />
          <p className="text-xs text-slate-500 font-medium">Loading customer database records...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Customers', href: '/customers' }, { label: 'Details' }]} />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="text-sm font-bold text-[#DE3C4B]">{error || 'Customer not found'}</h3>
          <p className="mt-1 text-xs text-slate-600">The requested customer could not be retrieved from the database.</p>
          <div className="mt-4">
            <Link
              to="/customers"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#192342] px-4 py-2 text-xs font-semibold text-white shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Customers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { customer, distributor, summary, milkEntries, payments, monthlyBills } = data

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Platform Customers', href: '/customers' },
          { label: customer.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
              {customer.name}
            </h1>
            <span className="rounded-xl bg-[#EFF2FE] px-2.5 py-1 text-xs font-bold text-[#4768E8]">
              #{customer.uniqueNumber}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                customer.isActive
                  ? 'bg-[#EBF7EE] text-[#1E8E42]'
                  : 'bg-[#FEECEE] text-[#DE3C4B]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  customer.isActive ? 'bg-[#1E8E42]' : 'bg-[#DE3C4B]'
                }`}
              />
              {customer.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Customer ID: {customer.cid}
          </p>
        </div>

        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE9F2] bg-white px-4 py-2 text-xs font-semibold text-[#192342] shadow-sm hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Customer List
        </Link>
      </div>

      {/* 4 Financial & Collection Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Milk Delivered"
          value={`${summary.totalLiters.toFixed(2)} L`}
          subtitle={`${milkEntries.length} recorded entries`}
          icon={<Droplets className="h-5 w-5" />}
          iconColor="purple"
        />
        <StatCard
          title="Total Billed"
          value={formatINR(summary.totalBilled)}
          subtitle="Cumulative billing"
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="Payments Received"
          value={formatINR(summary.totalPaid)}
          subtitle={`${payments.length} payments logged`}
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor="green"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatINR(summary.outstandingBalance)}
          subtitle={summary.outstandingBalance > 0 ? 'Pending collection' : 'Fully settled'}
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor={summary.outstandingBalance > 0 ? 'red' : 'green'}
          badgeText={summary.outstandingBalance > 0 ? 'Due' : 'Cleared'}
          badgeVariant={summary.outstandingBalance > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Profile & Associated Distributor Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Customer Profile Details */}
        <div className="rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-base font-bold text-[#192342]">
            <Users className="h-4 w-4 text-[#4768E8]" />
            <span>Customer Profile</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-[#F8F7FB] p-3">
              <div className="text-slate-400 font-medium">Customer Number</div>
              <div className="mt-1 font-bold text-[#192342]">#{customer.uniqueNumber}</div>
            </div>
            <div className="rounded-xl bg-[#F8F7FB] p-3">
              <div className="text-slate-400 font-medium">Mobile Phone</div>
              <div className="mt-1 font-bold text-[#192342] flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{customer.phoneNumber || 'Not provided'}</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#F8F7FB] p-3">
              <div className="text-slate-400 font-medium">Daily Milk Volume</div>
              <div className="mt-1 font-bold text-[#192342]">{customer.liters.toFixed(2)} Liters / day</div>
            </div>
            <div className="rounded-xl bg-[#F8F7FB] p-3">
              <div className="text-slate-400 font-medium">Applicable Rate</div>
              <div className="mt-1 font-bold text-[#192342]">₹{customer.price.toFixed(2)} / Liter</div>
            </div>
          </div>
        </div>

        {/* Associated Distributor Details */}
        <div className="rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold text-[#192342]">
              <Building2 className="h-4 w-4 text-[#4768E8]" />
              <span>Associated Distributor</span>
            </div>
            <Link
              to={`/distributors/${distributor.did}`}
              className="text-xs font-semibold text-[#4768E8] hover:underline"
            >
              View Dairy
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-[#F8F7FB] p-3">
              <div className="text-slate-400 font-medium">Dairy Name</div>
              <div className="mt-1 font-bold text-[#192342]">{distributor.dairyName}</div>
            </div>
            <div className="rounded-xl bg-[#F8F7FB] p-3">
              <div className="text-slate-400 font-medium">Owner Name</div>
              <div className="mt-1 font-bold text-[#192342]">{distributor.ownerName}</div>
            </div>
            <div className="rounded-xl bg-[#F8F7FB] p-3">
              <div className="text-slate-400 font-medium">Owner Email</div>
              <div className="mt-1 font-medium text-[#192342] truncate flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{distributor.ownerEmail || '—'}</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#F8F7FB] p-3">
              <div className="text-slate-400 font-medium">Owner Mobile</div>
              <div className="mt-1 font-medium text-[#192342] flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{distributor.ownerPhone || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation: Milk History, Monthly Bills, Payment History */}
      <div className="rounded-2xl border border-[#EAE9F2] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#EAE9F2] px-6 pt-4 flex gap-6">
          <button
            onClick={() => setActiveTab('milk-history')}
            className={`pb-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'milk-history'
                ? 'border-[#4768E8] text-[#4768E8]'
                : 'border-transparent text-slate-500 hover:text-[#192342]'
            }`}
          >
            <Droplets className="h-4 w-4" />
            <span>Milk Collection History ({milkEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly-bills')}
            className={`pb-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'monthly-bills'
                ? 'border-[#4768E8] text-[#4768E8]'
                : 'border-transparent text-slate-500 hover:text-[#192342]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Monthly Bills ({monthlyBills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-[#4768E8] text-[#4768E8]'
                : 'border-transparent text-slate-500 hover:text-[#192342]'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Payment History ({payments.length})</span>
          </button>
        </div>

        {/* Tab 1: Milk Collection History */}
        {activeTab === 'milk-history' && (
          <div>
            {milkEntries.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No milk collection entries recorded for this customer in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EAE9F2] bg-[#F8F7FB] text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Entry Date</th>
                      <th className="px-6 py-3.5">Milk Quantity</th>
                      <th className="px-6 py-3.5">Rate / Liter</th>
                      <th className="px-6 py-3.5">Total Amount</th>
                      <th className="px-6 py-3.5">Record ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE9F2]">
                    {milkEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-3.5 font-medium text-[#192342]">
                          {e.entryDate}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-700">
                          {e.liters.toFixed(2)} L
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          ₹{e.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-[#192342]">
                          {formatINR(e.total)}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                          {e.eid.slice(0, 8)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Monthly Bills */}
        {activeTab === 'monthly-bills' && (
          <div>
            {monthlyBills.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No monthly billing statements aggregated yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EAE9F2] bg-[#F8F7FB] text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Period (Month)</th>
                      <th className="px-6 py-3.5">Total Quantity</th>
                      <th className="px-6 py-3.5">Billed Amount</th>
                      <th className="px-6 py-3.5">Amount Paid</th>
                      <th className="px-6 py-3.5">Balance Due</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE9F2]">
                    {monthlyBills.map((b) => (
                      <tr key={b.period} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-3.5 font-bold text-[#192342]">
                          {b.period}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-700">
                          {b.liters.toFixed(2)} L ({b.entriesCount} entries)
                        </td>
                        <td className="px-6 py-3.5 font-bold text-[#192342]">
                          {formatINR(b.billedAmount)}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-[#1E8E42]">
                          {formatINR(b.paidAmount)}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-[#DE3C4B]">
                          {formatINR(b.dueAmount)}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              b.status === 'Paid'
                                ? 'bg-[#EBF7EE] text-[#1E8E42]'
                                : b.status === 'Partial'
                                ? 'bg-[#FEF6E8] text-[#C28416]'
                                : 'bg-[#FEECEE] text-[#DE3C4B]'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payment History */}
        {activeTab === 'payments' && (
          <div>
            {payments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No payments have been recorded for this customer in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EAE9F2] bg-[#F8F7FB] text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Payment Date</th>
                      <th className="px-6 py-3.5">Billing Period</th>
                      <th className="px-6 py-3.5">Bill Amount</th>
                      <th className="px-6 py-3.5">Amount Received</th>
                      <th className="px-6 py-3.5">Note / Memo</th>
                      <th className="px-6 py-3.5">Receipt ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE9F2]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-3.5 font-medium text-[#192342]">
                          {p.receivedDate}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-700">
                          {p.period}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {formatINR(p.billAmount)}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-[#1E8E42]">
                          {formatINR(p.receivedAmount)}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {p.note || 'Cash payment'}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                          {p.pid.slice(0, 8)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
