import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCustomers } from '@/hooks/useCustomers'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCompactINR, formatINR } from '@/lib/utils'
import { customerService } from '@/services/customer.service'
import { SendBillModal } from '@/components/SendBillModal'
import type { Customer, CustomerWithBilling } from '@/types'
import {
  Search,
  Users,
  CheckCircle2,
  Clock,
  Droplets,
  Plus,
  ArrowRight,
  ChevronLeft,
  Loader2,
  X,
  MessageSquare,
} from 'lucide-react'

export function CustomersPage() {
  const { id: distributorParamId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { customers, isLoading, fetchCustomers } = useCustomers()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedCustomerForBill, setSelectedCustomerForBill] = useState<Customer | null>(null)

  // New Customer Form state
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerLiters, setNewCustomerLiters] = useState('2.0')
  const [newCustomerPrice, setNewCustomerPrice] = useState('65')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const distributorId = distributorParamId || 'my-dairy'
  const distributorName = user?.dairyName || 'My Dairy'

  // Map ONLY real customers from database
  const customersWithBilling: CustomerWithBilling[] = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    })

    return customers.map((c, index) => {
      const dailyAmount = Number(c.liters || 0) * Number(c.price || 0)
      const monthlyEstimate = dailyAmount * 30

      return {
        ...c,
        dailyAmount,
        monthlyEstimate,
        latestBill: {
          billNumber: `BILL-${String(index + 1).padStart(3, '0')}`,
          amount: monthlyEstimate,
          status: 'Paid',
          dueDate: currentMonth,
          paidDate: 'Active',
        },
        totalBilled: monthlyEstimate,
        lastPaymentDate: 'Active',
      }
    })
  }, [customers])

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customersWithBilling.filter((c) => {
      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.phoneNumber && c.phoneNumber.includes(term)) ||
        (c.uniqueNumber && c.uniqueNumber.includes(term))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && c.latestBill?.status === 'Paid') ||
        (statusFilter === 'pending' && c.latestBill?.status === 'Pending') ||
        (statusFilter === 'overdue' && c.latestBill?.status === 'Overdue')

      return matchesSearch && matchesStatus
    })
  }, [customersWithBilling, searchTerm, statusFilter])

  // Real KPI stats calculated directly from database
  const totalCustomerCount = customers.length
  const totalDailyVolume = customers.reduce(
    (sum, c) => sum + Number(c.liters || 0),
    0
  )
  const totalMonthlyBilled = customers.reduce(
    (sum, c) => sum + Number(c.liters || 0) * Number(c.price || 0) * 30,
    0
  )

  // Handle Add Customer form submission
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await customerService.createCustomer({
        name: newCustomerName.trim(),
        phoneNumber: newCustomerPhone.trim(),
        liters: parseFloat(newCustomerLiters) || 1,
        price: parseFloat(newCustomerPrice) || 60,
        notificationChannel: 'whatsapp',
      })
      await fetchCustomers()
      setNewCustomerName('')
      setNewCustomerPhone('')
      setAddModalOpen(false)
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || 'Failed to create customer. Please check fields.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: distributorName, href: `/distributors/${distributorId}` },
          { label: 'Customers' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
          Customers
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          All customer accounts for {distributorName} in the database.
        </p>

        <div className="mt-3">
          <Link
            to={`/distributors/${distributorId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4768E8] transition-colors hover:text-[#3754D1]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {distributorName}
          </Link>
        </div>
      </div>

      {/* 4 KPI cards (Real Data from DB) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={totalCustomerCount.toString()}
          subtitle="Registered accounts"
          icon={<Users className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="Active Customers"
          value={totalCustomerCount.toString()}
          subtitle="100% active"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="green"
        />
        <StatCard
          title="Daily Milk Volume"
          value={`${totalDailyVolume.toFixed(1)} L`}
          subtitle="Daily required volume"
          icon={<Droplets className="h-5 w-5" />}
          iconColor="amber"
        />
        <StatCard
          title="Estimated Monthly"
          value={formatCompactINR(totalMonthlyBilled)}
          subtitle="Estimated 30-day billing"
          icon={<Clock className="h-5 w-5" />}
          iconColor="teal"
        />
      </div>

      {/* Customer Directory Section */}
      <div className="rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#192342]">
              Customer directory
            </h2>
            <p className="text-xs text-[#64748B]">
              Real customer accounts from your PostgreSQL database.
            </p>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4768E8] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#3754D1]"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>

        {/* Filters / Search Bar */}
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, mobile or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-transparent pl-10 pr-4 text-xs text-[#192342] placeholder:text-slate-400 focus:border-[#4768E8] focus:outline-none focus:ring-2 focus:ring-[#4768E8]/10"
            />
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-[#64748B] mr-1">
              Status:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-200 text-[#192342]'
                  : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                statusFilter === 'paid'
                  ? 'bg-[#EBF7EE] text-[#1E8E42] ring-1 ring-[#1E8E42]/20'
                  : 'bg-[#EBF7EE]/60 text-[#1E8E42] hover:bg-[#EBF7EE]'
              }`}
            >
              Active
            </button>
          </div>
        </div>

        {/* Customer Table */}
        <div className="mt-5 overflow-x-auto">
          {isLoading && customers.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No customers found in database. Click "Add Customer" to add one.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE9F2] text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                  <th className="pb-3 font-semibold">CUSTOMER</th>
                  <th className="pb-3 font-semibold">MOBILE</th>
                  <th className="pb-3 font-semibold">DAILY VOLUME</th>
                  <th className="pb-3 font-semibold">RATE (₹/L)</th>
                  <th className="pb-3 font-semibold">MONTHLY EST.</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                  <th className="pb-3 text-right font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE9F2]">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() =>
                      navigate(`/distributors/${distributorId}/customers/${cust.id}`)
                    }
                    className="group cursor-pointer transition-colors hover:bg-slate-50/70"
                  >
                    <td className="py-4 font-bold text-[#192342]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-400">
                          #{cust.uniqueNumber}
                        </span>
                        <span>{cust.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-[#64748B]">
                      {cust.phoneNumber || '—'}
                    </td>
                    <td className="py-4 font-semibold text-[#4768E8]">
                      {Number(cust.liters || 0).toFixed(1)} L
                    </td>
                    <td className="py-4 font-medium text-[#192342]">
                      ₹{cust.price}
                    </td>
                    <td className="py-4 font-semibold text-[#192342]">
                      {formatINR(Number(cust.liters || 0) * Number(cust.price || 0) * 30)}
                    </td>
                    <td className="py-4">
                      <StatusBadge status="Active" />
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCustomerForBill(cust)
                          }}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                          title="Send WhatsApp Bill"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#4768E8] transition-transform group-hover:translate-x-1">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-[#192342]">Add Customer</h3>
            <p className="mt-1 text-xs text-slate-500">
              Create a new customer account in the database.
            </p>

            {formError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-[#DE3C4B]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs focus:border-[#4768E8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Mobile Number (WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98251 22441"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs focus:border-[#4768E8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Daily Liters *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newCustomerLiters}
                    onChange={(e) => setNewCustomerLiters(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs focus:border-[#4768E8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Rate per Liter (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={newCustomerPrice}
                    onChange={(e) => setNewCustomerPrice(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs focus:border-[#4768E8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#4768E8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3754D1] disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Bill Modal */}
      <SendBillModal
        customer={selectedCustomerForBill}
        isOpen={!!selectedCustomerForBill}
        onClose={() => setSelectedCustomerForBill(null)}
      />
    </div>
  )
}
