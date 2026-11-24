import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/admin.service'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import { formatCompactINR, formatINR } from '@/lib/utils'
import type { TransactionItem } from '@/types'
import {
  Search,
  IndianRupee,
  Loader2,
  Receipt,
  RefreshCw,
  CreditCard,
} from 'lucide-react'

export function BillingPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [summary, setSummary] = useState<{
    totalTransactions: number
    totalReceivedAmount: number
    totalBilledAmount: number
    totalOutstandingAmount: number
  }>({
    totalTransactions: 0,
    totalReceivedAmount: 0,
    totalBilledAmount: 0,
    totalOutstandingAmount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getTransactions()
      setTransactions(res.transactions || [])
      setSummary(res.summary)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load transaction records')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return transactions

    return transactions.filter((t) => {
      const custName = t.customer?.name?.toLowerCase() || ''
      const custNum = t.customer?.uniqueNumber?.toString() || ''
      const dairyName = t.distributor?.dairyName?.toLowerCase() || ''
      const period = t.period?.toLowerCase() || ''
      const note = t.note?.toLowerCase() || ''
      const pid = t.pid?.toLowerCase() || ''

      return (
        custName.includes(term) ||
        custNum.includes(term) ||
        dairyName.includes(term) ||
        period.includes(term) ||
        note.includes(term) ||
        pid.includes(term)
      )
    })
  }, [transactions, searchTerm])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Billing & Transactions' }]} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
            Platform Transactions & Billing
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Global financial ledger tracking distributor billing collections, customer monthly settlements, and transaction receipts.
          </p>
        </div>

        <button
          onClick={loadTransactions}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#EAE9F2] bg-white px-4 py-2 text-xs font-semibold text-[#192342] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Transactions
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Transactions"
          value={summary.totalTransactions.toString()}
          subtitle="Logged payments & receipts"
          icon={<Receipt className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="Payments Collected"
          value={formatCompactINR(summary.totalReceivedAmount)}
          subtitle="Total settlements received"
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor="green"
          badgeText="Verified"
          badgeVariant="success"
        />
        <StatCard
          title="Total Invoiced"
          value={formatCompactINR(summary.totalBilledAmount)}
          subtitle="Cumulative billing charges"
          icon={<CreditCard className="h-5 w-5" />}
          iconColor="purple"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatINR(summary.totalOutstandingAmount)}
          subtitle="Uncollected net balance"
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor={summary.totalOutstandingAmount > 0 ? 'red' : 'green'}
          badgeText={summary.totalOutstandingAmount > 0 ? 'Pending' : 'Settled'}
          badgeVariant={summary.totalOutstandingAmount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#EAE9F2] bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, unique #, dairy name, period, or receipt ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#EAE9F2] bg-[#F8F7FB] py-2 pl-10 pr-4 text-xs text-[#192342] placeholder-slate-400 focus:border-[#4768E8] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-[#DE3C4B]">
          {error}
        </div>
      )}

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EAE9F2] bg-white shadow-sm">
        {isLoading && transactions.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-[#192342]">No transactions found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm
                ? 'No matching payment records found for your search query.'
                : 'No payments have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EAE9F2] bg-[#F8F7FB] text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Payment Date</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Associated Dairy</th>
                  <th className="px-6 py-3.5">Billing Period</th>
                  <th className="px-6 py-3.5">Billed Amount</th>
                  <th className="px-6 py-3.5">Amount Paid</th>
                  <th className="px-6 py-3.5">Remaining Balance</th>
                  <th className="px-6 py-3.5">Note / Memo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE9F2]">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#192342]">{t.receivedDate}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        ID: {t.pid.slice(0, 8)}...
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/customers/${t.customer?.cid}`}
                        className="font-bold text-[#4768E8] hover:underline"
                      >
                        #{t.customer?.uniqueNumber} {t.customer?.name}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/distributors/${t.distributor?.did}`}
                        className="font-semibold text-slate-700 hover:text-[#4768E8]"
                      >
                        {t.distributor?.dairyName}
                      </Link>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {t.period}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatINR(t.billAmount)}
                    </td>

                    <td className="px-6 py-4 font-bold text-[#1E8E42]">
                      {formatINR(t.receivedAmount)}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {formatINR(t.balance)}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {t.note || 'Cash payment'}
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
