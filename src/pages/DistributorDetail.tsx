import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers } from '@/hooks/useCustomers'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { SendBillModal } from '@/components/SendBillModal'
import {
  ArrowLeft,
  IndianRupee,
  Droplets,
  Hash,
  Loader2,
  AlertCircle,
  Package,
  MessageSquare,
} from 'lucide-react'

export function DistributorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { customers, isLoading, error, fetchCustomers } = useCustomers()
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const customer = useMemo(
    () => customers.find((c) => c.id === id),
    [customers, id]
  )

  const stats = useMemo(() => {
    if (!customer) return null
    const dailyAmount = Number(customer.liters) * Number(customer.price)
    return {
      dailyAmount,
      monthlyEstimate: dailyAmount * 30,
      liters: Number(customer.liters),
      price: Number(customer.price),
    }
  }, [customer])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading customer details...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
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
    )
  }

  if (!customer || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-2 text-center">
          <Package className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Customer not found
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            The customer you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/distributors')}
            className="mt-2 h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/distributors')}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-base font-semibold text-primary">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {customer.name}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {user?.dairyName ? `${user.dairyName} · ` : ''}Customer #{customer.uniqueNumber}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBillModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <MessageSquare className="h-4 w-4" />
            Send WhatsApp Bill
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<Hash className="h-4 w-4" />}
          label="Customer Number"
          value={`#${customer.uniqueNumber}`}
          color="primary"
        />
        <InfoCard
          icon={<Droplets className="h-4 w-4" />}
          label="Daily Liters"
          value={`${stats.liters.toFixed(1)} L`}
          color="info"
        />
        <InfoCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Price per Liter"
          value={formatCurrency(stats.price)}
          color="warning"
        />
        <InfoCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Daily Amount"
          value={formatCurrency(stats.dailyAmount)}
          color="success"
        />
      </div>

      {/* Billing Summary Card */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Billing Summary
            </h2>
            <p className="text-xs text-muted-foreground">
              Estimated billing based on current rate
            </p>
          </div>
          <button
            onClick={() => setIsBillModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Send Bill
          </button>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                    Period
                  </th>
                  <th className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                    Liters
                  </th>
                  <th className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                    Rate
                  </th>
                  <th className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="h-10 px-4 text-sm text-foreground">Daily</td>
                  <td className="h-10 px-4 text-right text-sm tabular-nums">
                    {stats.liters.toFixed(1)} L
                  </td>
                  <td className="h-10 px-4 text-right text-sm tabular-nums">
                    {formatCurrency(stats.price)}
                  </td>
                  <td className="h-10 px-4 text-right text-sm font-medium tabular-nums text-foreground">
                    {formatCurrency(stats.dailyAmount)}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="h-10 px-4 text-sm text-foreground">
                    Weekly (7 days)
                  </td>
                  <td className="h-10 px-4 text-right text-sm tabular-nums">
                    {(stats.liters * 7).toFixed(1)} L
                  </td>
                  <td className="h-10 px-4 text-right text-sm tabular-nums">
                    {formatCurrency(stats.price)}
                  </td>
                  <td className="h-10 px-4 text-right text-sm font-medium tabular-nums text-foreground">
                    {formatCurrency(stats.dailyAmount * 7)}
                  </td>
                </tr>
                <tr className="border-b border-border bg-primary/5">
                  <td className="h-10 px-4 text-sm font-medium text-primary">
                    Monthly (30 days)
                  </td>
                  <td className="h-10 px-4 text-right text-sm font-medium tabular-nums text-primary">
                    {(stats.liters * 30).toFixed(1)} L
                  </td>
                  <td className="h-10 px-4 text-right text-sm tabular-nums text-primary">
                    {formatCurrency(stats.price)}
                  </td>
                  <td className="h-10 px-4 text-right text-sm font-semibold tabular-nums text-primary">
                    {formatCurrency(stats.monthlyEstimate)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Details Card */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Customer Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <DetailRow label="Customer Name" value={customer.name} />
          <DetailRow label="Customer Number" value={`#${customer.uniqueNumber}`} />
          <DetailRow label="Phone Number" value={customer.phoneNumber || 'Not provided'} />
          <DetailRow label="Daily Liters" value={`${stats.liters.toFixed(1)} L`} />
          <DetailRow label="Price per Liter" value={formatCurrency(stats.price)} />
          <DetailRow
            label="Daily Amount"
            value={formatCurrency(stats.dailyAmount)}
          />
          <DetailRow
            label="Monthly Estimate"
            value={formatCurrency(stats.monthlyEstimate)}
          />
        </div>
      </div>

      {/* WhatsApp Bill Modal */}
      <SendBillModal
        customer={customer}
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
      />
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
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
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md ${colorMap[color]}`}
        >
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
