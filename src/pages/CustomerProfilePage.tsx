import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCustomers } from '@/hooks/useCustomers'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, formatDate, getInitials } from '@/lib/utils'
import { customerService } from '@/services/customer.service'
import { SendBillModal } from '@/components/SendBillModal'
import type { Customer, MilkEntry, CustomerBill } from '@/types'
import {
  ChevronLeft,
  Users,
  CheckCircle2,
  Clock,
  Droplets,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  MessageSquare,
  FileText,
  CalendarDays,
} from 'lucide-react'

export function CustomerProfilePage() {
  const { id: customerParamId, distId } = useParams<{ id: string; distId?: string }>()
  const { user } = useAuth()
  const { customers, isLoading: isCustomersLoading, fetchCustomers } = useCustomers()

  const [activeTab, setActiveTab] = useState<'daily-entries' | 'bill-history'>('daily-entries')
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)

  // Current selected month for daily entries (format: YYYY-MM)
  const currentMonthStr = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [])

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)
  const [entries, setEntries] = useState<MilkEntry[]>([])
  const [isEntriesLoading, setIsEntriesLoading] = useState(false)

  // Entry CRUD state
  const [entryModalOpen, setEntryModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [entryMorningLiters, setEntryMorningLiters] = useState('1.0')
  const [entryEveningLiters, setEntryEveningLiters] = useState('1.0')
  const [entryPrice, setEntryPrice] = useState('65')
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false)
  const [entryFormError, setEntryFormError] = useState<string | null>(null)

  // Delete confirmation modal
  const [deletingEntry, setDeletingEntry] = useState<MilkEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Find customer strictly in live database customers
  const customer: Customer | undefined = useMemo(() => {
    return customers.find((c) => c.id === customerParamId)
  }, [customers, customerParamId])

  const distributorId = distId || 'my-dairy'
  const distributorName = user?.dairyName || 'My Dairy'

  // Fetch entries strictly from backend database
  const loadEntries = useCallback(async () => {
    if (!customer?.id) return
    setIsEntriesLoading(true)

    try {
      const data = await customerService.getCustomerEntries(customer.id, selectedMonth)
      if (Array.isArray(data)) {
        setEntries(data)
      } else {
        setEntries([])
      }
    } catch {
      setEntries([])
    } finally {
      setIsEntriesLoading(false)
    }
  }, [customer?.id, selectedMonth])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // Dynamic monthly aggregations from actual entries
  const monthlyMetrics = useMemo(() => {
    const count = entries.length
    const totalMorning = entries.reduce(
      (sum, e) =>
        sum +
        (e.morningLiters != null ? Number(e.morningLiters) : Number(e.liters) * 0.5),
      0
    )
    const totalEvening = entries.reduce(
      (sum, e) =>
        sum +
        (e.eveningLiters != null ? Number(e.eveningLiters) : Number(e.liters) * 0.5),
      0
    )
    const totalLiters = entries.reduce((sum, e) => sum + Number(e.liters || 0), 0)
    const totalAmount = entries.reduce((sum, e) => sum + Number(e.total || 0), 0)

    return {
      count,
      totalMorning,
      totalEvening,
      totalLiters,
      totalAmount,
    }
  }, [entries])

  // Bill History generated from real entries
  const billHistory: CustomerBill[] = useMemo(() => {
    if (!customer) return []
    if (monthlyMetrics.count === 0) return []

    return [
      {
        id: `bill-${customer.id}-${selectedMonth}`,
        billNumber: `BILL-${customer.uniqueNumber}-${selectedMonth.replace('-', '')}`,
        period: selectedMonth,
        amount: monthlyMetrics.totalAmount,
        status: 'Paid',
        dueDate: `${selectedMonth}-28`,
        paidDate: `${selectedMonth}-28`,
        customerId: customer.id,
      },
    ]
  }, [customer, selectedMonth, monthlyMetrics])

  // Handle open entry modal
  const handleOpenAddEntry = () => {
    if (!customer) return
    setEditingEntry(null)
    setEntryDate(new Date().toISOString().slice(0, 10))
    const half = (Number(customer.liters || 2) * 0.5).toFixed(1)
    setEntryMorningLiters(half)
    setEntryEveningLiters(half)
    setEntryPrice(String(customer.price || 65))
    setEntryFormError(null)
    setEntryModalOpen(true)
  }

  const handleOpenEditEntry = (entry: MilkEntry) => {
    setEditingEntry(entry)
    setEntryDate(entry.entryDate)
    const m =
      entry.morningLiters != null
        ? String(entry.morningLiters)
        : (Number(entry.liters) * 0.5).toFixed(1)
    const ev =
      entry.eveningLiters != null
        ? String(entry.eveningLiters)
        : (Number(entry.liters) * 0.5).toFixed(1)
    setEntryMorningLiters(m)
    setEntryEveningLiters(ev)
    setEntryPrice(String(entry.price))
    setEntryFormError(null)
    setEntryModalOpen(true)
  }

  // Handle submit entry to real backend API
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return
    setIsSubmittingEntry(true)
    setEntryFormError(null)

    const m = parseFloat(entryMorningLiters) || 0
    const ev = parseFloat(entryEveningLiters) || 0
    const totalLiters = Number((m + ev).toFixed(2))
    const price = parseFloat(entryPrice) || Number(customer.price) || 65

    if (totalLiters <= 0) {
      setEntryFormError('Total quantity must be greater than 0.')
      setIsSubmittingEntry(false)
      return
    }

    try {
      await customerService.createOrUpdateEntry(customer.id, {
        entryDate,
        liters: totalLiters,
        price,
      })

      await loadEntries()
      setEntryModalOpen(false)
    } catch (err: any) {
      setEntryFormError(
        err?.response?.data?.message || 'Failed to save entry to database.'
      )
    } finally {
      setIsSubmittingEntry(false)
    }
  }

  // Handle delete entry in real backend API
  const handleConfirmDelete = async () => {
    if (!customer || !deletingEntry) return
    setIsDeleting(true)

    try {
      await customerService.deleteEntry(customer.id, deletingEntry.id)
      await loadEntries()
      setDeletingEntry(null)
    } catch {
      // ignore
    } finally {
      setIsDeleting(false)
    }
  }

  if (isCustomersLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#4768E8]" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-lg font-bold text-[#192342]">Customer Not Found</h2>
        <p className="mt-1 text-xs text-[#64748B]">
          No matching customer account found in your database.
        </p>
        <Link
          to={`/distributors/${distributorId}/customers`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#4768E8] px-4 py-2 text-xs font-semibold text-white"
        >
          Back to Customer List
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: distributorName, href: `/distributors/${distributorId}` },
          { label: 'Customers', href: `/distributors/${distributorId}/customers` },
          { label: customer.name },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
          {customer.name}
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Customer profile · {distributorName}.
        </p>

        <div className="mt-3">
          <Link
            to={`/distributors/${distributorId}/customers`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4768E8] transition-colors hover:text-[#3754D1]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Customer List
          </Link>
        </div>
      </div>

      {/* Customer Profile Header Card */}
      <div className="rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar with initials */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EFF2FE] text-lg font-bold text-[#4768E8]">
              {getInitials(customer.name)}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#192342]">
                  {customer.name}
                </h2>
                <StatusBadge status="Active" />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                <span>ID: #{customer.uniqueNumber}</span>
                <span>•</span>
                <span>{customer.phoneNumber || 'No phone registered'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsBillModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <MessageSquare className="h-4 w-4" />
              Send WhatsApp Bill
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI cards (Real Data) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Daily Volume"
          value={`${Number(customer.liters || 0).toFixed(1)} L`}
          subtitle="Agreed daily quota"
          icon={<Droplets className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="Rate per Liter"
          value={`₹${customer.price}`}
          subtitle="Standard milk rate"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="green"
        />
        <StatCard
          title="Estimated Monthly"
          value={formatINR(Number(customer.liters || 0) * Number(customer.price || 0) * 30)}
          subtitle="30-day projection"
          icon={<Clock className="h-5 w-5" />}
          iconColor="amber"
        />
        <StatCard
          title="Month Recorded Days"
          value={`${monthlyMetrics.count} days`}
          subtitle={`In ${selectedMonth}`}
          icon={<Users className="h-5 w-5" />}
          iconColor="teal"
        />
      </div>

      {/* Tab Navigation: Daily Milk Entries vs Bill History */}
      <div className="flex border-b border-[#EAE9F2] text-sm font-semibold">
        <button
          onClick={() => setActiveTab('daily-entries')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
            activeTab === 'daily-entries'
              ? 'border-[#4768E8] text-[#4768E8]'
              : 'border-transparent text-[#64748B] hover:text-[#192342]'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Daily Milk Entries
          <span className="rounded-full bg-[#EFF2FE] px-2 py-0.5 text-[11px] font-bold text-[#4768E8]">
            {monthlyMetrics.count}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bill-history')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
            activeTab === 'bill-history'
              ? 'border-[#4768E8] text-[#4768E8]'
              : 'border-transparent text-[#64748B] hover:text-[#192342]'
          }`}
        >
          <FileText className="h-4 w-4" />
          Bill History
        </button>
      </div>

      {/* TAB 1: Daily Milk Entries (Real Database Records) */}
      {activeTab === 'daily-entries' && (
        <div className="space-y-6">
          {/* Monthly Card Summary View */}
          <div className="rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-[#192342]">
                  Monthly Summary Card
                </h3>
                <p className="text-xs text-[#64748B]">
                  Live entries aggregate from database for {selectedMonth}.
                </p>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[#64748B]">
                  Billing Month:
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-9 rounded-xl border border-[#E2E8F0] px-3 text-xs font-semibold text-[#192342] focus:border-[#4768E8] focus:outline-none"
                />
              </div>
            </div>

            {/* Monthly Card Metrics Grid */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-xl bg-[#F8F7FB] p-3.5 border border-[#EAE9F2]">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase">
                  Recorded Days
                </p>
                <p className="mt-1 text-xl font-bold text-[#192342]">
                  {monthlyMetrics.count} days
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F7FB] p-3.5 border border-[#EAE9F2]">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase">
                  Morning Volume
                </p>
                <p className="mt-1 text-xl font-bold text-[#192342]">
                  {monthlyMetrics.totalMorning.toFixed(1)} L
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F7FB] p-3.5 border border-[#EAE9F2]">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase">
                  Evening Volume
                </p>
                <p className="mt-1 text-xl font-bold text-[#192342]">
                  {monthlyMetrics.totalEvening.toFixed(1)} L
                </p>
              </div>

              <div className="rounded-xl bg-[#EFF2FE] p-3.5 border border-[#4768E8]/20">
                <p className="text-[11px] font-semibold text-[#4768E8] uppercase">
                  Total Volume
                </p>
                <p className="mt-1 text-xl font-bold text-[#4768E8]">
                  {monthlyMetrics.totalLiters.toFixed(1)} L
                </p>
              </div>

              <div className="rounded-xl bg-[#EBF7EE] p-3.5 border border-[#1E8E42]/20 col-span-2 sm:col-span-1">
                <p className="text-[11px] font-semibold text-[#1E8E42] uppercase">
                  Monthly Total
                </p>
                <p className="mt-1 text-xl font-bold text-[#1E8E42]">
                  {formatINR(monthlyMetrics.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Entries Breakdown Table */}
          <div className="rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-[#192342]">
                  Daily Entry Details
                </h3>
                <p className="text-xs text-[#64748B]">
                  Records saved in PostgreSQL for {selectedMonth}.
                </p>
              </div>

              <button
                onClick={handleOpenAddEntry}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4768E8] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#3754D1]"
              >
                <Plus className="h-4 w-4" />
                Add Daily Entry
              </button>
            </div>

            {/* Entries Table */}
            <div className="mt-5 overflow-x-auto">
              {isEntriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
                </div>
              ) : entries.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#64748B]">
                  No daily milk records found in database for {selectedMonth}. Click "Add Daily Entry" to create one.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAE9F2] text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                      <th className="pb-3 font-semibold">DATE</th>
                      <th className="pb-3 font-semibold">TOTAL LITERS</th>
                      <th className="pb-3 font-semibold">RATE (₹/L)</th>
                      <th className="pb-3 font-semibold">TOTAL AMOUNT</th>
                      <th className="pb-3 text-right font-semibold">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE9F2]">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="py-3.5 font-bold text-[#192342]">
                          {formatDate(entry.entryDate)}
                        </td>
                        <td className="py-3.5 font-bold text-[#4768E8]">
                          {Number(entry.liters).toFixed(1)} L
                        </td>
                        <td className="py-3.5 text-[#64748B]">
                          ₹{entry.price}
                        </td>
                        <td className="py-3.5 font-bold text-[#192342]">
                          {formatINR(entry.total)}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditEntry(entry)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#EFF2FE] hover:text-[#4768E8]"
                              title="Edit Entry"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingEntry(entry)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-[#DE3C4B]"
                              title="Delete Entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Bill History */}
      {activeTab === 'bill-history' && (
        <div className="rounded-2xl border border-[#EAE9F2] bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-[#192342]">Bill History</h2>
            <p className="text-xs text-[#64748B]">
              Statements generated from daily collection entries.
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            {billHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748B]">
                No bills generated yet. Record daily milk entries to generate monthly statements.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE9F2] text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                    <th className="pb-3 font-semibold">BILL NO.</th>
                    <th className="pb-3 font-semibold">PERIOD</th>
                    <th className="pb-3 font-semibold">AMOUNT</th>
                    <th className="pb-3 font-semibold">STATUS</th>
                    <th className="pb-3 font-semibold">DUE DATE</th>
                    <th className="pb-3 font-semibold">PAID ON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE9F2]">
                  {billHistory.map((bill) => (
                    <tr key={bill.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="py-4 font-bold text-[#192342]">
                        {bill.billNumber}
                      </td>
                      <td className="py-4 text-[#64748B]">{bill.period}</td>
                      <td className="py-4 font-semibold text-[#192342]">
                        {formatINR(bill.amount)}
                      </td>
                      <td className="py-4">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="py-4 text-[#64748B]">
                        {formatDate(bill.dueDate)}
                      </td>
                      <td className="py-4 text-[#64748B]">
                        {bill.paidDate ? formatDate(bill.paidDate) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Daily Entry Modal */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setEntryModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-[#192342]">
              {editingEntry ? 'Edit Daily Milk Entry' : 'Add Daily Milk Entry'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Record daily milk collection for {customer.name}.
            </p>

            {entryFormError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-[#DE3C4B]">
                {entryFormError}
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Entry Date *
                </label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs focus:border-[#4768E8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Morning Liters
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={entryMorningLiters}
                    onChange={(e) => setEntryMorningLiters(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs focus:border-[#4768E8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Evening Liters
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={entryEveningLiters}
                    onChange={(e) => setEntryEveningLiters(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs focus:border-[#4768E8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Rate per Liter (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs focus:border-[#4768E8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Total Amount
                  </label>
                  <div className="mt-1 flex h-9 items-center rounded-xl bg-slate-50 px-3 text-xs font-bold text-[#1E8E42] border border-[#E2E8F0]">
                    {formatINR(
                      ((parseFloat(entryMorningLiters) || 0) +
                        (parseFloat(entryEveningLiters) || 0)) *
                        (parseFloat(entryPrice) || 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEntry}
                  className="flex items-center gap-1.5 rounded-xl bg-[#4768E8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3754D1] disabled:opacity-50"
                >
                  {isSubmittingEntry && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#192342]">
              Delete Milk Entry?
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              Are you sure you want to delete the record for{' '}
              <span className="font-semibold text-[#192342]">
                {formatDate(deletingEntry.entryDate)}
              </span>
              ? This action will permanently remove it from the database.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingEntry(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 rounded-xl bg-[#DE3C4B] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Bill Modal */}
      <SendBillModal
        customer={customer}
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
      />
    </div>
  )
}
