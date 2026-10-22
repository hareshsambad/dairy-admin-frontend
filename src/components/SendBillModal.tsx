import { useState, useId, useEffect } from 'react';
import type { Customer } from '@/types';
import { whatsappService } from '@/services/whatsapp.service';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Calendar,
  Clock,
  IndianRupee,
  Droplets,
  X,
  User,
  FileText,
  SunMedium,
  ExternalLink,
} from 'lucide-react';

interface SendBillModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SendBillModal({
  customer,
  isOpen,
  onClose,
}: SendBillModalProps) {
  const phoneInputId = useId();
  const sessionSelectId = useId();
  const dateInputId = useId();
  const litersInputId = useId();
  const rateInputId = useId();
  const monthInputId = useId();
  const daysInputId = useId();
  const monthlyLitersInputId = useId();
  const previousDueInputId = useId();
  const notesInputId = useId();

  // Mode: 'daily' (everyday milk update) vs 'monthly' (full monthly statement)
  const [billType, setBillType] = useState<'daily' | 'monthly'>('daily');

  // Common field
  const [phone, setPhone] = useState('');

  // Daily mode fields
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState<'Morning' | 'Evening' | 'Full Day'>('Morning');
  const [dailyLiters, setDailyLiters] = useState('1.0');
  const [rate, setRate] = useState('60');

  // Monthly mode fields
  const currentMonthName = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const [monthName, setMonthName] = useState(currentMonthName);
  const [totalDays, setTotalDays] = useState('30');
  const [monthlyLiters, setMonthlyLiters] = useState('30.0');
  const [previousDue, setPreviousDue] = useState('0');

  // Shared note
  const [notes, setNotes] = useState('');

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    messageId: string;
    formattedMessage: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state dynamically whenever customer changes or modal opens
  useEffect(() => {
    if (customer && isOpen) {
      const raw = customer.phoneNumber ? customer.phoneNumber.trim() : '';
      const digitsOnly = raw.replace(/[^\d]/g, '');
      const formatted = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;

      const customerLiters =
        customer.liters !== undefined && customer.liters !== null
          ? Number(customer.liters)
          : 1.0;
      const customerRate =
        customer.price !== undefined && customer.price !== null
          ? Number(customer.price)
          : 60.0;

      setPhone(formatted);
      setDailyLiters(customerLiters.toFixed(1));
      setRate(customerRate.toFixed(2));
      setDate(new Date().toISOString().slice(0, 10));
      setSession(new Date().getHours() < 14 ? 'Morning' : 'Evening');

      // Monthly defaults (30 days)
      setTotalDays('30');
      setMonthlyLiters((customerLiters * 30).toFixed(1));
      setMonthName(
        new Date().toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
        })
      );
      setPreviousDue('0');
      setNotes('');
      setErrorMsg(null);
      setSuccessResult(null);
    }
  }, [customer, isOpen]);

  // When totalDays or dailyLiters changes in monthly mode, auto-calculate monthly liters
  const handleDaysChange = (daysVal: string) => {
    setTotalDays(daysVal);
    const d = Number(daysVal) || 0;
    const l = Number(dailyLiters) || 0;
    setMonthlyLiters((d * l).toFixed(1));
  };

  if (!isOpen || !customer) return null;

  // Numerical calculations
  const numRate = Number(rate) || 0;
  const numDailyLiters = Number(dailyLiters) || 0;
  const dailyTotal = numDailyLiters * numRate;

  const numMonthlyLiters = Number(monthlyLiters) || 0;
  const monthlyMilkCharge = numMonthlyLiters * numRate;
  const numPrevDue = Number(previousDue) || 0;
  const netMonthlyPayable = monthlyMilkCharge + numPrevDue;

  const currentPreviewMessage = whatsappService.formatBillMessage(
    billType === 'daily'
      ? {
          to: phone,
          customerName: customer.name,
          type: 'daily',
          date: new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          deliverySession: session,
          liters: numDailyLiters,
          ratePerLiter: numRate,
          totalAmount: dailyTotal,
          notes: notes.trim() || undefined,
        }
      : {
          to: phone,
          customerName: customer.name,
          type: 'monthly',
          monthName,
          totalDays: Number(totalDays) || 30,
          totalLiters: numMonthlyLiters,
          ratePerLiter: numRate,
          monthlyAmount: monthlyMilkCharge,
          previousDue: numPrevDue,
          totalAmount: netMonthlyPayable,
          notes: notes.trim() || undefined,
        }
  );

  const handleOpenWhatsAppWeb = () => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid phone number with country code (e.g. 919104152524)');
      return;
    }
    const url = whatsappService.getWhatsAppUrl(cleanPhone, currentPreviewMessage);
    window.open(url, '_blank');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessResult(null);

    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid phone number with country code (e.g. 919104152524)');
      return;
    }

    setIsLoading(true);
    try {
      if (billType === 'daily') {
        const res = await whatsappService.sendBill({
          to: cleanPhone,
          customerName: customer.name,
          type: 'daily',
          date: new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          deliverySession: session,
          liters: numDailyLiters,
          ratePerLiter: numRate,
          totalAmount: dailyTotal,
          notes: notes.trim() || undefined,
        });
        setSuccessResult(res);
      } else {
        const res = await whatsappService.sendBill({
          to: cleanPhone,
          customerName: customer.name,
          type: 'monthly',
          monthName,
          totalDays: Number(totalDays) || 30,
          totalLiters: numMonthlyLiters,
          ratePerLiter: numRate,
          monthlyAmount: monthlyMilkCharge,
          previousDue: numPrevDue,
          totalAmount: netMonthlyPayable,
          notes: notes.trim() || undefined,
        });
        setSuccessResult(res);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj.response?.data?.message ||
        errorObj.message ||
        'Failed to send WhatsApp message. Please check connection and credentials.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessResult(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-20 rounded-full p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="bg-emerald-600 px-6 pt-5 pb-4 text-white">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">
              💬
            </span>
            Send WhatsApp Notification
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-emerald-100">
            <span className="flex items-center gap-1 font-medium text-white">
              <User className="h-3 w-3" />
              {customer.name}
            </span>
            <span>·</span>
            <span>Customer #{customer.uniqueNumber}</span>
          </div>

          {/* Mode Switch Tabs */}
          <div className="mt-3.5 grid grid-cols-2 rounded-xl bg-emerald-800/50 p-1">
            <button
              type="button"
              onClick={() => {
                setBillType('daily');
                setNotes('');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                billType === 'daily'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <SunMedium className="h-3.5 w-3.5" />
              Daily Milk Update
            </button>
            <button
              type="button"
              onClick={() => {
                setBillType('monthly');
                setNotes('');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                billType === 'monthly'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Monthly Total Bill
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {successResult ? (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {billType === 'daily'
                    ? `Daily Milk Update Sent to ${customer.name}!`
                    : `Monthly Statement Sent to ${customer.name}!`}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Delivered via WhatsApp to{' '}
                  <strong className="text-foreground">{phone}</strong>
                </p>
                <div className="mt-3 rounded-md bg-muted p-2.5 text-left text-xs font-mono text-muted-foreground">
                  <span className="font-semibold text-foreground">Message ID:</span>{' '}
                  {successResult.messageId}
                </div>
              </div>

              {/* Message preview snippet */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 text-left text-xs text-foreground whitespace-pre-line leading-relaxed font-mono">
                {successResult.formattedMessage}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = phone.replace(/[^\d]/g, '');
                    window.open(whatsappService.getWhatsAppUrl(cleanPhone, successResult.formattedMessage), '_blank');
                  }}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 shadow-sm transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                  Open in WhatsApp Web
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex w-full flex-1 justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Sending failed:</strong> {errorMsg}
                  </div>
                </div>
              )}

              {/* Recipient Phone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={phoneInputId} className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    {customer.name}'s WhatsApp Number
                  </label>
                  {!customer.phoneNumber && (
                    <span className="text-[11px] font-medium text-amber-600">
                      (No number on file)
                    </span>
                  )}
                </div>
                <input
                  id={phoneInputId}
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="919876543210 (Country code + 10 digits)"
                  required
                  className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Indian numbers automatically include 91 prefix.
                </p>
              </div>

              {/* DAILY MODE FIELDS */}
              {billType === 'daily' && (
                <div className="space-y-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <SunMedium className="h-3.5 w-3.5" />
                    Today's Milk Delivery Details
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={dateInputId} className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Delivery Date
                      </label>
                      <input
                        id={dateInputId}
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label htmlFor={sessionSelectId} className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Session
                      </label>
                      <select
                        id={sessionSelectId}
                        value={session}
                        onChange={(e) =>
                          setSession(e.target.value as 'Morning' | 'Evening' | 'Full Day')
                        }
                        className="w-full rounded-lg border border-input bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Morning">🌅 Morning</option>
                        <option value="Evening">🌇 Evening</option>
                        <option value="Full Day">🥛 Full Day</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={litersInputId} className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                        <Droplets className="h-3.5 w-3.5 text-blue-600" />
                        Today's Liters
                      </label>
                      <input
                        id={litersInputId}
                        type="number"
                        step="0.1"
                        min="0"
                        value={dailyLiters}
                        onChange={(e) => setDailyLiters(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label htmlFor={rateInputId} className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                        <IndianRupee className="h-3.5 w-3.5 text-amber-600" />
                        Rate / Liter
                      </label>
                      <input
                        id={rateInputId}
                        type="number"
                        step="0.5"
                        min="0"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-emerald-100/80 px-3 py-2 border border-emerald-200">
                    <span className="text-xs font-semibold text-emerald-900">
                      Today's Amount:
                    </span>
                    <span className="text-base font-bold text-emerald-800">
                      ₹{dailyTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* MONTHLY MODE FIELDS */}
              {billType === 'monthly' && (
                <div className="space-y-3.5 rounded-xl border border-blue-100 bg-blue-50/30 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <FileText className="h-3.5 w-3.5" />
                    Monthly Billing Summary
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={monthInputId} className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Billing Month
                      </label>
                      <input
                        id={monthInputId}
                        type="text"
                        value={monthName}
                        onChange={(e) => setMonthName(e.target.value)}
                        placeholder="October 2026"
                        required
                        className="w-full rounded-lg border border-input bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label htmlFor={daysInputId} className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Total Days
                      </label>
                      <input
                        id={daysInputId}
                        type="number"
                        min="1"
                        max="31"
                        value={totalDays}
                        onChange={(e) => handleDaysChange(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label htmlFor={monthlyLitersInputId} className="flex items-center gap-1 text-[11px] font-semibold text-foreground mb-1">
                        <Droplets className="h-3 w-3 text-blue-600" />
                        Total Liters
                      </label>
                      <input
                        id={monthlyLitersInputId}
                        type="number"
                        step="0.5"
                        min="0"
                        value={monthlyLiters}
                        onChange={(e) => setMonthlyLiters(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label htmlFor={rateInputId} className="flex items-center gap-1 text-[11px] font-semibold text-foreground mb-1">
                        <IndianRupee className="h-3 w-3 text-amber-600" />
                        Rate / L
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label htmlFor={previousDueInputId} className="flex items-center gap-1 text-[11px] font-semibold text-foreground mb-1">
                        <IndianRupee className="h-3 w-3 text-red-500" />
                        Previous Due
                      </label>
                      <input
                        id={previousDueInputId}
                        type="number"
                        step="1"
                        min="0"
                        value={previousDue}
                        onChange={(e) => setPreviousDue(e.target.value)}
                        className="w-full rounded-lg border border-input bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Summary calculation */}
                  <div className="rounded-lg bg-blue-100/70 p-2.5 space-y-1 text-xs border border-blue-200">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Monthly Milk Charge:</span>
                      <span className="font-semibold text-foreground">₹{monthlyMilkCharge.toFixed(2)}</span>
                    </div>
                    {numPrevDue > 0 && (
                      <div className="flex justify-between text-red-700">
                        <span>Previous Balance Due:</span>
                        <span className="font-semibold">₹{numPrevDue.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-blue-200 pt-1 text-sm font-bold text-blue-900">
                      <span>Total Net Payable:</span>
                      <span className="text-emerald-700">₹{netMonthlyPayable.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Note */}
              <div>
                <label htmlFor={notesInputId} className="block text-xs font-semibold text-foreground mb-1">
                  Optional Note / Payment Instructions
                </label>
                <input
                  id={notesInputId}
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    billType === 'daily'
                      ? 'Delivered to doorstep'
                      : 'Pay via GPay / PhonePe to 9876543210'
                  }
                  className="w-full rounded-xl border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Message Live Preview */}
              <div className="space-y-1.5 rounded-xl border border-muted bg-muted/40 p-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Message Preview:</span>
                  <span className="text-emerald-700 font-medium">Ready to send</span>
                </div>
                <div className="max-h-32 overflow-y-auto whitespace-pre-line rounded-lg bg-white p-2.5 text-[11px] leading-relaxed text-foreground font-mono border border-input shadow-inner">
                  {currentPreviewMessage}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-input/60">
                <button
                  type="button"
                  onClick={handleOpenWhatsAppWeb}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 shadow-sm transition-colors disabled:opacity-50"
                  title="Open directly in WhatsApp Web with prefilled message"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                  Open in WhatsApp Web
                </button>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="rounded-xl border border-input bg-transparent px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Send via Cloud API
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
