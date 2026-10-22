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

    const lines = [
      `🥛 *DAILY MILK DELIVERY UPDATE* 🥛`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Customer:* ${payload.customerName}`,
      `📅 *Date:* ${today}`,
      payload.deliverySession ? `⏰ *Session:* ${payload.deliverySession}` : null,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 *Today's Quantity:* ${liters.toFixed(1)} Liters`,
      `💰 *Rate:* ₹${rate.toFixed(2)} / Liter`,
      `💵 *Today's Total:* ₹${todayAmount.toFixed(2)}`,
      payload.notes ? `\n📝 *Note:* ${payload.notes}` : null,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🙏 *Thank you for choosing our dairy!*`,
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

    const lines = [
      `🧾 *MONTHLY MILK BILLING STATEMENT* 🧾`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Customer:* ${payload.customerName}`,
      `📅 *Billing Month:* ${month}`,
      `🗓️ *Total Delivery Days:* ${days} Days`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🥛 *Total Milk Delivered:* ${liters.toFixed(1)} Liters`,
      `💰 *Rate per Liter:* ₹${rate.toFixed(2)} / Liter`,
      `💵 *Monthly Milk Charge:* ₹${monthlyTotal.toFixed(2)}`,
      prevDue > 0 ? `⚠️ *Previous Balance Due:* ₹${prevDue.toFixed(2)}` : null,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💳 *NET TOTAL PAYABLE:* ₹${netPayable.toFixed(2)}`,
      payload.notes ? `\n📝 *Note:* ${payload.notes}` : null,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📲 *Please complete payment by cash or UPI.*`,
      `🙏 *Thank you for your business!*`,
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

  async sendBill(payload: SendBillPayload): Promise<SendBillResponse> {
    const formattedMessage = this.formatBillMessage(payload);

    try {
      // First try dedicated send-bill endpoint
      const response = await api.post<{ messageId: string }>(
        '/whatsapp/send-bill',
        {
          ...payload,
          notes: payload.notes,
        }
      );
      return {
        messageId: response.data.messageId,
        formattedMessage,
      };
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number } };
      // Fallback seamlessly to send-text
      if (errorObj.response?.status === 404 || errorObj.response?.status === 400) {
        const response = await api.post<{ messageId: string }>(
          '/whatsapp/send-text',
          {
            to: payload.to,
            message: formattedMessage,
          }
        );
        return {
          messageId: response.data.messageId,
          formattedMessage,
        };
      }
      throw err;
    }
  },
};
