import { useState, useMemo, useEffect } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { useAuth } from '@/hooks/useAuth'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StatCard } from '@/components/dashboard/StatCard'
import { whatsappService } from '@/services/whatsapp.service'
import {
  Search,
  MessageSquare,
  CheckSquare,
  Square,
  MinusSquare,
  Send,
  Loader2,
  CheckCircle2,
  X,
  Users,
  ShieldAlert,
} from 'lucide-react'

export function MessagesPage() {
  const { user } = useAuth()
  const { customers, isLoading, fetchCustomers } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [templateType, setTemplateType] = useState<'daily' | 'monthly'>('daily')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number; failed: number } | null>(null)
  const [batchResult, setBatchResult] = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return customers.filter((c) => {
      if (!term) return true
      return (
        c.name.toLowerCase().includes(term) ||
        (c.phoneNumber && c.phoneNumber.includes(term)) ||
        (c.uniqueNumber && c.uniqueNumber.includes(term))
      )
    })
  }, [customers, searchTerm])

  const visibleIds = useMemo(() => {
    return filteredCustomers.map((c) => c.id)
  }, [filteredCustomers])

  // Select all status: all, none, or indeterminate (some)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds)
    if (allVisibleSelected) {
      // Deselect all visible
      for (const id of visibleIds) {
        next.delete(id)
      }
    } else {
      // Select all visible
      for (const id of visibleIds) {
        next.add(id)
      }
    }
    setSelectedIds(next)
  }

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // Generate sample message for preview
  const sampleCustomer = useMemo(() => {
    if (selectedIds.size > 0) {
      const firstId = Array.from(selectedIds)[0]
      return customers.find((c) => c.id === firstId) || customers[0]
    }
    return customers[0]
  }, [selectedIds, customers])

  const previewText = useMemo(() => {
    if (!sampleCustomer) return 'No customer selected to preview message.'
    const liters = Number(sampleCustomer.liters) || 1.5
    const rate = Number(sampleCustomer.price) || 60
    return whatsappService.formatBillMessage({
      to: sampleCustomer.phoneNumber || '919876543210',
      customerName: sampleCustomer.name,
      type: templateType,
      liters,
      ratePerLiter: rate,
      totalLiters: liters * 30,
      totalAmount: liters * rate,
      monthlyAmount: liters * rate * 30,
      distributorName: user?.dairyName || 'Dairy Desk',
      distributorPhone: '+91 9104152524',
    })
  }, [sampleCustomer, templateType, user])

  // Execute bulk sending with rate limit delays & failure safety
  const handleExecuteBulkSend = async () => {
    const targetCustomers = customers.filter((c) => selectedIds.has(c.id) && c.phoneNumber)
    if (targetCustomers.length === 0) return

    setConfirmationOpen(false)
    setIsSending(true)
    setBatchResult(null)
    setSendProgress({ current: 0, total: targetCustomers.length, failed: 0 })

    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < targetCustomers.length; i++) {
      const c = targetCustomers[i]
      try {
        await whatsappService.sendBill({
          to: c.phoneNumber!,
          customerName: c.name,
          type: templateType,
          liters: Number(c.liters) || 1,
          ratePerLiter: Number(c.price) || 60,
          distributorName: user?.dairyName || 'Dairy Desk',
        })
        successCount++
      } catch {
        failedCount++
      }
      setSendProgress({ current: i + 1, total: targetCustomers.length, failed: failedCount })
      // Brief pause between requests to prevent rate limiting
      if (i < targetCustomers.length - 1) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    setIsSending(false)
    setBatchResult({ success: successCount, failed: failedCount })
    setSendProgress(null)
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Overview' }, { label: 'Messaging' }]} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192342] sm:text-3xl">
            WhatsApp Messaging & Alerts
          </h1>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Send daily delivery confirmation receipts or monthly statements directly to customers.
          </p>
        </div>

        {/* Template Selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#EAE9F2] bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setTemplateType('daily')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              templateType === 'daily'
                ? 'bg-[#4768E8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Daily Delivery Update
          </button>
          <button
            type="button"
            onClick={() => setTemplateType('monthly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              templateType === 'monthly'
                ? 'bg-[#4768E8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Monthly Statement
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Recipients"
          value={customers.length.toString()}
          subtitle="Registered customer accounts"
          icon={<Users className="h-5 w-5" />}
          iconColor="blue"
        />
        <StatCard
          title="WhatsApp Enabled"
          value={customers.filter((c) => c.phoneNumber).length.toString()}
          subtitle="Valid registered phone numbers"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="green"
        />
        <StatCard
          title="Currently Selected"
          value={selectedIds.size.toString()}
          subtitle="Ready for dispatch"
          icon={<MessageSquare className="h-5 w-5" />}
          iconColor={selectedIds.size > 0 ? 'teal' : 'amber'}
        />
      </div>

      {/* Batch Result Banner */}
      {batchResult && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 border border-emerald-200">
          <div className="flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>
              Bulk dispatch complete: <strong>{batchResult.success} sent</strong>
              {batchResult.failed > 0 && `, ${batchResult.failed} failed`}.
            </span>
          </div>
          <button
            onClick={() => setBatchResult(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {isSending && sendProgress && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Sending WhatsApp messages ({sendProgress.current} of {sendProgress.total})...
            </span>
            <span>{Math.round((sendProgress.current / sendProgress.total) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Split View: Recipient Table + Live Message Preview */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recipient Selection Card (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#EAE9F2] bg-white p-5 shadow-sm space-y-4">
          {/* Controls: Compact Search & Enhanced Select All Button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Compact Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipients by name or phone..."
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

            {/* Redesigned Select All Messages Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                disabled={visibleIds.length === 0}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                  allVisibleSelected
                    ? 'border-[#1E8E42] bg-[#EBF7EE] text-[#1E8E42] shadow-xs'
                    : someVisibleSelected
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {allVisibleSelected ? (
                  <CheckSquare className="h-4 w-4 text-[#1E8E42]" />
                ) : someVisibleSelected ? (
                  <MinusSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>
                  {allVisibleSelected
                    ? `Deselect All (${visibleIds.length})`
                    : `Select All (${visibleIds.length})`}
                </span>
              </button>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Clear ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          {/* Recipient Table */}
          <div className="overflow-x-auto">
            {isLoading && customers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#4768E8]" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No recipients found matching your filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE9F2] text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="w-10 pb-2.5"></th>
                    <th className="pb-2.5 font-semibold">CUSTOMER</th>
                    <th className="pb-2.5 font-semibold">PHONE</th>
                    <th className="pb-2.5 font-semibold">DAILY QUOTA</th>
                    <th className="pb-2.5 font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE9F2]">
                  {filteredCustomers.map((cust) => {
                    const isSelected = selectedIds.has(cust.id)
                    const hasPhone = !!cust.phoneNumber

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => handleToggleSelectOne(cust.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(cust.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-slate-300 text-[#4768E8] focus:ring-[#4768E8]"
                          />
                        </td>
                        <td className="py-2.5 font-semibold text-[#192342]">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EBF7EE] text-[10px] font-bold text-[#1E8E42] border border-[#C5E8CE]">
                              {cust.uniqueNumber || '1'}
                            </div>
                            <span>{cust.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-600 font-mono text-[11px]">
                          {cust.phoneNumber || (
                            <span className="text-amber-600 font-sans italic">Missing phone</span>
                          )}
                        </td>
                        <td className="py-2.5 font-semibold text-[#4768E8]">
                          {cust.liters} L @ ₹{cust.price}
                        </td>
                        <td className="py-2.5">
                          {hasPhone ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              No Phone
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Message Preview & Action Panel (1 col) */}
        <div className="rounded-2xl border border-[#EAE9F2] bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#192342]">WhatsApp Message Preview</h3>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {templateType === 'daily' ? 'Daily' : 'Monthly'}
              </span>
            </div>

            {/* Chat bubble preview */}
            <div className="rounded-xl border border-emerald-200 bg-[#E8F5E9]/50 p-3.5 text-xs text-slate-800 shadow-inner font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {previewText}
            </div>
            <p className="text-[11px] text-slate-400">
              Personalized placeholders ({'{customerName}'}, {'{liters}'}, {'{totalAmount}'}) are dynamically calculated per recipient.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              disabled={selectedIds.size === 0 || isSending}
              onClick={() => setConfirmationOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              Send to {selectedIds.size} Selected Recipient{selectedIds.size === 1 ? '' : 's'}
            </button>
            <p className="text-center text-[10px] text-slate-400">
              Dispatches via WhatsApp Business Cloud API with automatic delivery tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before Bulk Dispatch */}
      {confirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#192342]">Confirm Bulk WhatsApp Dispatch</h3>
                <p className="text-xs text-slate-500">Irreversible external messaging operation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to send <strong>{selectedIds.size} WhatsApp message{selectedIds.size === 1 ? '' : 's'}</strong> ({templateType === 'daily' ? 'Daily Update' : 'Monthly Statement'}) to real customer phone numbers.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmationOpen(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkSend}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
