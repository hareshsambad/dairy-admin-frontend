import api from './api';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  MilkEntry,
  CreateMilkEntryRequest,
} from '../types';

export const customerService = {
  async getCustomers(search?: string): Promise<Customer[]> {
    const params = search ? { search } : {};
    const response = await api.get<Customer[]>('/customers', { params });
    return response.data;
  },

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  async updateCustomer(customerId: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await api.patch<Customer>(`/customers/${customerId}`, data);
    return response.data;
  },

  async getCustomerEntries(customerId: string, month?: string): Promise<MilkEntry[]> {
    const params = month ? { month } : {};
    const response = await api.get<MilkEntry[]>(`/customers/${customerId}/entries`, { params });
    return response.data;
  },

  async createOrUpdateEntry(
    customerId: string,
    data: CreateMilkEntryRequest
  ): Promise<MilkEntry> {
    const response = await api.post<MilkEntry>(`/customers/${customerId}/entries`, data);
    return response.data;
  },

  async deleteEntry(
    customerId: string,
    entryId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/customers/${customerId}/entries/${entryId}`
    );
    return response.data;
  },

  async notifyWhatsApp(
    customerId: string,
    data: { liters: number; price: number }
  ): Promise<any> {
    const response = await api.post(`/customers/${customerId}/entries/notify`, data);
    return response.data;
  },
};
