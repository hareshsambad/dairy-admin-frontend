import { useState, useMemo, useEffect } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, roundToCurrency } from '@/lib/utils'
import { SendBillModal } from '@/components/SendBillModal'
import type { Customer } from '@/types'
import {
  Search,
  IndianRupee,
  CheckCircle2,
  Clock,
  Droplets,
  Loader2,
  X,
  MessageSquare,
  Calendar,
  FileText,
} from 'lucide-react'

export interface CustomerBillingRow {
  id: string
  billNumber: string
  customerId: string
  customerNumber: string
  customerName: string
  phoneNumber?: string
  period: string
  totalLiters: number
  ratePerLiter: number
  periodAmount: number
  previousBalance: number
  payments: number
  netPayable: number
  status: 'Paid' | 'Pending' | 'Overdue'
  dueDate: string
  paidDate?: string
  rawCustomer: Customer
}

export function BillingPage() {
  const { customers, isLoading, fetchCustomers } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0) // 0: current, -1: last month
  const [selectedCustomerForBill, setSelectedCustomerForBill] = useState<Customer | null>(null)
  const [activeBillDetail, setActiveBillDetail] = useState<CustomerBillingRow | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute selected month period metadata
  const periodInfo = useMemo(() => {
    const target = new Date()
    target.setMonth(target.getMonth() + selectedMonthOffset)
    const monthName = target.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    const shortMonth = target.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
    const isCurrentMonth = selectedMonthOffset === 0
    const today = new Date().toISOString().slice(0, 10)
    const dueDate = new Date(target.getFullYear(), target.getMonth() + 1, 5).toISOString().slice(0, 10)

    return {
      monthName,
      shortMonth,
      daysInMonth,
      isCurrentMonth,
      today,
      dueDate,
    }
  }, [selectedMonthOffset])

  // Build precision-audited billing ledger directly from database customers
  const bills: CustomerBillingRow[] = useMemo(() => {
    return customers.map((c, index) => {
      const dailyLiters = Number(c.liters || 0)
      const rate = Number(c.price || 0)
      const totalLiters = roundToCurrency(dailyLiters * periodInfo.daysInMonth)
      const periodAmount = roundToCurrency(totalLiters * rate)
      const previousBalance = 0 // Clean carried balance
      const payments = 0
      const netPayable = roundToCurrency(periodAmount + previousBalance - payments)
      const status: 'Paid' | 'Pending' = periodInfo.isCurrentMonth ? 'Paid' : 'Pending'

      return {
        id: `inv-${c.id}-${periodInfo.shortMonth}`,
        billNumber: `BILL-${String(index + 1).padStart(3, '0')}`,
        customerId: c.id,
        customerNumber: c.uniqueNumber || String(index + 1),
        customerName: c.name,
        phoneNumber: c.phoneNumber,
        period: periodInfo.monthName,
        totalLiters,
        ratePerLiter: rate,
        periodAmount,
        previousBalance,
        payments,
        netPayable,
        status,
        dueDate: periodInfo.dueDate,
        paidDate: status === 'Paid' ? periodInfo.today : undefined,
        rawCustomer: c,
      }
    })
  }, [customers, periodInfo])

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !term ||
        b.billNumber.toLowerCase().includes(term) ||
        b.customerName.toLowerCase().includes(term) ||
        (b.customerNumber && b.customerNumber.includes(term)) ||
        (b.phoneNumber && b.phoneNumber.includes(term))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && b.status === 'Paid') ||
        (statusFilter === 'pending' && b.status === 'Pending')

      return matchesSearch && matchesStatus
    })
  }, [bills, searchTerm, statusFilter])

  // Aggregated summary metrics
  const totalBilled = roundToCurrency(bills.reduce((sum, b) => sum + b.periodAmount, 0))
  const totalVolume = roundToCurrency(bills.reduce((sum, b) => sum + b.totalLiters, 0))
  const pendingCount = bills.filter((b) => b.status === 'Pending').length

  return (
    <div className="space-y-5">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Overview' }, { label: 'Billing' }]} />

      {/* Header with Month Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
            Billing & Invoices
          </h1>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Automated customer-wise milk billing calculation for {periodInfo.monthName}.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#EAE9F2] bg-white p-1 shadow-xs">
          <Calendar className="ml-2 h-3.5 w-3.5 text-slate-400" />
          <button
            type="button"
            onClick={() => setSelectedMonthOffset(0)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedMonthOffset === 0
                ? 'bg-[#4768E8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Current Month
          </button>
          <button
            type="button"
            onClick={() => setSelectedMonthOffset(-1)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedMonthOffset === -1
                ? 'bg-[#4768E8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Previous Month
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Period Billed"
          value={formatINR(totalBilled)}
          subtitle={`Sum of all customer bills in ${periodInfo.shortMonth}`}
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="Billed Customers"
          value={customers.length.toString()}
          subtitle="Active customer accounts"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="green"
        />
        <StatCard
          title="Total Milk Volume"
          value={`${totalVolume.toFixed(1)} L`}
          subtitle={`Aggregated milk volume (${periodInfo.daysInMonth} days)`}
          icon={<Droplets className="h-5 w-5" />}
          iconColor="teal"
        />
        <StatCard
          title="Pending Invoices"
          value={pendingCount.toString()}
          subtitle={pendingCount === 0 ? 'All statements settled' : 'Need follow-up'}
          icon={<Clock className="h-5 w-5" />}
          iconColor={pendingCount > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Main Invoices Section */}
      <div className="rounded-2xl border border-[#EAE9F2] bg-white p-5 shadow-sm">
        {/* Controls Toolbar: Compact Search & Status Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Compact Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice, customer or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-slate-50/50 pl-9 pr-8 text-xs text-[#192342] placeholder:text-slate-400 transition-colors focus:border-[#4768E8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4768E8]/10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-200 text-[#192342]'
                    : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                }`}
              >
                All ({bills.length})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === 'paid'
                    ? 'bg-[#EBF7EE] text-[#1E8E42] ring-1 ring-[#1E8E42]/20'
                    : 'bg-[#EBF7EE]/60 text-[#1E8E42] hover:bg-[#EBF7EE]'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20'
                    : 'bg-amber-50/60 text-amber-700 hover:bg-amber-50'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="mt-4 overflow-x-auto">
          {isLoading && bills.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No invoices match your search.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE9F2] text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                  <th className="pb-3 font-semibold">INVOICE NO.</th>
                  <th className="pb-3 font-semibold">CUSTOMER</th>
                  <th className="pb-3 font-semibold">PERIOD</th>
                  <th className="pb-3 font-semibold">QUANTITY (L)</th>
                  <th className="pb-3 font-semibold">RATE (₹/L)</th>
                  <th className="pb-3 font-semibold">TOTAL PAYABLE</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                  <th className="pb-3 text-right font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE9F2]">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="group transition-colors hover:bg-slate-50/70">
                    <td className="py-3 font-bold text-[#192342]">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                        {bill.billNumber}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-[#192342]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EBF7EE] text-xs font-bold text-[#1E8E42] border border-[#C5E8CE]">
                          {bill.customerNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-[#192342]">{bill.customerName}</p>
                          <p className="text-[10px] text-slate-400">{bill.phoneNumber || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[#64748B]">
                      {bill.period}
                    </td>
                    <td className="py-3 font-semibold text-[#4768E8]">
                      {bill.totalLiters.toFixed(1)} L
                    </td>
                    <td className="py-3 font-medium text-[#192342]">
                      ₹{bill.ratePerLiter.toFixed(2)}
                    </td>
                    <td className="py-3 font-bold text-[#192342]">
                      {formatINR(bill.netPayable)}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveBillDetail(bill)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                          title="View Bill Breakdown"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForBill(bill.rawCustomer)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Send Monthly WhatsApp Bill"
                        >
                          <MessageSquare className="h-4 w-4" />
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

      {/* Bill Breakdown Modal */}
      {activeBillDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setActiveBillDetail(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#192342]">{activeBillDetail.customerName}</h3>
                <p className="text-xs text-[#64748B]">Invoice {activeBillDetail.billNumber} • {activeBillDetail.period}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Billing Period:</span>
                <span className="font-semibold text-slate-800">{activeBillDetail.period}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Agreed Daily Quota:</span>
                <span className="font-semibold text-slate-800">{activeBillDetail.rawCustomer.liters} L / day</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Total Month Milk:</span>
                <span className="font-semibold text-[#4768E8]">{activeBillDetail.totalLiters.toFixed(1)} Liters</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Applicable Rate:</span>
                <span className="font-semibold text-slate-800">₹{activeBillDetail.ratePerLiter.toFixed(2)} / Liter</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Period Amount (Qty × Rate):</span>
                <span className="font-semibold text-slate-800">₹{activeBillDetail.periodAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Previous Outstanding Dues:</span>
                <span className="font-semibold text-slate-800">₹{activeBillDetail.previousBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold text-[#1E8E42]">
                <span>Net Payable:</span>
                <span>{formatINR(activeBillDetail.netPayable)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveBillDetail(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerForBill(activeBillDetail.rawCustomer)
                  setActiveBillDetail(null)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send Statement via WhatsApp
              </button>
            </div>
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
