import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCustomers } from '@/hooks/useCustomers'
import { formatCurrency } from '@/lib/utils'
import type { Customer } from '@/types'
import { SendBillModal } from '@/components/SendBillModal'
import {
  Search,
  Users,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  Package,
  MessageSquare,
} from 'lucide-react'

export function DistributorOverview() {
  const { user } = useAuth()
  const { customers, isLoading, error, fetchCustomers } = useCustomers()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'amount'>('number')
  const [selectedCustomerForBill, setSelectedCustomerForBill] = useState<Customer | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute stats from customer data
  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const totalDailyRevenue = customers.reduce(
      (sum, c) => sum + Number(c.liters) * Number(c.price),
      0
    )
    const totalLiters = customers.reduce(
      (sum, c) => sum + Number(c.liters),
      0
    )
    const avgPrice =
      totalCustomers > 0
        ? customers.reduce((sum, c) => sum + Number(c.price), 0) /
          totalCustomers
        : 0

    return { totalCustomers, totalDailyRevenue, totalLiters, avgPrice }
  }, [customers])

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.uniqueNumber.toLowerCase().includes(term)
      )
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'amount':
          return (
            Number(b.liters) * Number(b.price) -
            Number(a.liters) * Number(a.price)
          )
        case 'number':
        default:
          return Number(a.uniqueNumber) - Number(b.uniqueNumber)
      }
    })

    return result
  }, [customers, searchTerm, sortBy])

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Dashboard
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {user?.dairyName ? `${user.dairyName} — ` : ''}Overview of your dairy operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toString()}
          icon={<Users className="h-4 w-4" />}
          subtitle="Active customers"
          color="primary"
        />
        <StatCard
          title="Daily Revenue"
          value={formatCurrency(stats.totalDailyRevenue)}
          icon={<IndianRupee className="h-4 w-4" />}
          subtitle="Estimated daily"
          color="success"
        />
        <StatCard
          title="Total Liters/Day"
          value={`${stats.totalLiters.toFixed(1)} L`}
          icon={<TrendingUp className="h-4 w-4" />}
          subtitle="Daily milk volume"
          color="info"
        />
        <StatCard
          title="Avg. Price/Liter"
          value={formatCurrency(stats.avgPrice)}
          icon={<IndianRupee className="h-4 w-4" />}
          subtitle="Per liter average"
          color="warning"
        />
      </div>

      {/* Customers Section */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        {/* Table Header */}
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Customers
            </h2>
            <p className="text-xs text-muted-foreground">
              {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-48 rounded-md border border-input bg-transparent pl-8 pr-3 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-56"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'number' | 'name' | 'amount')
              }
              className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="number">Sort by #</option>
              <option value="name">Sort by Name</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading customers...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                Failed to load data
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">{error}</p>
              <button
                onClick={() => fetchCustomers()}
                className="mt-2 h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2 text-center">
              <Package className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {searchTerm ? 'No matching customers' : 'No customers yet'}
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {searchTerm
                  ? `No customers match "${searchTerm}". Try a different search.`
                  : 'Customers added via the distributor app will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                    Customer Name
                  </th>
                  <th className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                    Liters/Day
                  </th>
                  <th className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                    Price/L
                  </th>
                  <th className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                    Daily Amount
                  </th>
                  <th className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                    Monthly Est.
                  </th>
                  <th className="h-9 px-4 text-center text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const dailyAmount =
                    Number(customer.liters) * Number(customer.price)
                  const monthlyEstimate = dailyAmount * 30

                  return (
                    <tr
                      key={customer.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="h-10 px-4 text-xs font-mono text-muted-foreground">
                        {customer.uniqueNumber}
                      </td>
                      <td className="h-10 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {customer.name}
                            </span>
                            {customer.phoneNumber && (
                              <span className="block text-[11px] text-muted-foreground">
                                {customer.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="h-10 px-4 text-right text-sm tabular-nums">
                        {Number(customer.liters).toFixed(1)} L
                      </td>
                      <td className="h-10 px-4 text-right text-sm tabular-nums">
                        {formatCurrency(Number(customer.price))}
                      </td>
                      <td className="h-10 px-4 text-right text-sm font-medium tabular-nums text-foreground">
                        {formatCurrency(dailyAmount)}
                      </td>
                      <td className="h-10 px-4 text-right text-sm tabular-nums text-muted-foreground">
                        {formatCurrency(monthlyEstimate)}
                      </td>
                      <td className="h-10 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedCustomerForBill(customer)}
                            className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-50 px-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                            title={`Send WhatsApp Bill to ${customer.name}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Send Bill</span>
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/distributors/${customer.id}`)
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            title={`View ${customer.name}`}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {!isLoading && !error && filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              Showing {filteredCustomers.length} customer
              {filteredCustomers.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs font-medium text-foreground">
              Total Daily:{' '}
              {formatCurrency(
                filteredCustomers.reduce(
                  (sum, c) => sum + Number(c.liters) * Number(c.price),
                  0
                )
              )}
            </p>
          </div>
        )}
      </div>

      {/* WhatsApp Bill Modal */}
      <SendBillModal
        customer={selectedCustomerForBill}
        isOpen={!!selectedCustomerForBill}
        onClose={() => setSelectedCustomerForBill(null)}
      />
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  subtitle,
  color,
}: {
  title: string
  value: string
  icon: React.ReactNode
  subtitle: string
  color: 'primary' | 'success' | 'info' | 'warning'
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700',
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}
