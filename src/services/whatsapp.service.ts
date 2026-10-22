import api from './api';

export interface SendBillPayload {
  to: string;
  customerName: string;
  type?: 'daily' | 'monthly';
  // Daily fields
  liters?: number;
  ratePerLiter?: number;
  deliverySession?: string;
  date?: string;
  // Monthly fields
  monthName?: string;
  totalDays?: number;
  totalLiters?: number;
  monthlyAmount?: number;
  previousDue?: number;
  totalAmount?: number;
  distributorName?: string;
  distributorPhone?: string;
  notes?: string;
  customMessage?: string;
}

export interface SendBillResponse {
  messageId: string;
  formattedMessage: string;
}

export const whatsappService = {
  formatDailyMessage(payload: SendBillPayload): string {
    const today =
      payload.date ||
      new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    const liters = Number(payload.liters) || 0;
    const rate = Number(payload.ratePerLiter) || 0;
    const todayAmount = payload.totalAmount !== undefined ? Number(payload.totalAmount) : liters * rate;
    const distName = payload.distributorName || 'Haresh Sambad';
    const distPhone = payload.distributorPhone || '+91 9104152524';

    const lines = [
      `🥛 *Milk Billing & Delivery Update* 🥛`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Hello ${payload.customerName},`,
      ``,
      `Your milk bill update for ${today} has been generated.`,
      ``,
      `Details:`,
      `• Quantity: ${liters.toFixed(1)} L`,
      `• Rate: ₹${rate.toFixed(2)}/L`,
      `• Total Amount Due: ₹${todayAmount.toFixed(2)}`,
      payload.notes ? `• Note: ${payload.notes}` : null,
      ``,
      `Please review your delivery details. For any queries or corrections, please contact your distributor:`,
      ``,
      `Distributor Name: ${distName}`,
      `Contact Number: ${distPhone}`,
      `They will be happy to assist you.`,
      `Dairy Desk Management`,
    ].filter(Boolean) as string[];

    return lines.join('\n');
  },

  formatMonthlyMessage(payload: SendBillPayload): string {
    const month =
      payload.monthName ||
      new Date().toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });
    const days = Number(payload.totalDays) || 30;
    const liters = Number(payload.totalLiters) || (Number(payload.liters) || 0) * days;
    const rate = Number(payload.ratePerLiter) || 0;
    const monthlyTotal =
      payload.monthlyAmount !== undefined
        ? Number(payload.monthlyAmount)
        : liters * rate;
    const prevDue = Number(payload.previousDue) || 0;
    const netPayable = monthlyTotal + prevDue;
    const distName = payload.distributorName || 'Haresh Sambad';
    const distPhone = payload.distributorPhone || '+91 9104152524';

    const lines = [
      `🧾 *Milk Billing & Delivery Update* 🧾`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Hello ${payload.customerName},`,
      ``,
      `Your milk bill update for ${month} (${days} Days) has been generated.`,
      ``,
      `Details:`,
      `• Total Quantity: ${liters.toFixed(1)} L`,
      `• Rate: ₹${rate.toFixed(2)}/L`,
      `• Monthly Charge: ₹${monthlyTotal.toFixed(2)}`,
      prevDue > 0 ? `• Previous Due: ₹${prevDue.toFixed(2)}` : null,
      `• Total Amount Due: ₹${netPayable.toFixed(2)}`,
      payload.notes ? `• Note: ${payload.notes}` : null,
      ``,
      `Please review your delivery details. For any queries or corrections, please contact your distributor:`,
      ``,
      `Distributor Name: ${distName}`,
      `Contact Number: ${distPhone}`,
      `They will be happy to assist you.`,
      `Dairy Desk Management`,
    ].filter(Boolean) as string[];

    return lines.join('\n');
  },

  formatBillMessage(payload: SendBillPayload): string {
    if (payload.customMessage) return payload.customMessage;
    if (payload.type === 'monthly') {
      return this.formatMonthlyMessage(payload);
    }
    return this.formatDailyMessage(payload);
  },

  getWhatsAppUrl(phone: string, message: string): string {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  },

  async sendBill(payload: SendBillPayload): Promise<SendBillResponse> {
    const formattedMessage = this.formatBillMessage(payload);
    const response = await api.post<{
      messageId: string;
      formattedMessage: string;
    }>('/whatsapp/send-bill', {
      ...payload,
      useTemplate: true,
    });
    return {
      messageId: response.data.messageId,
      formattedMessage: response.data.formattedMessage || formattedMessage,
    };
  },
};
