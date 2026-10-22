import api from './api';
import type { Customer, CreateCustomerRequest } from '../types';

export const customerService = {
  async getCustomers(search?: string): Promise<Customer[]> {
    const params = search ? { search } : {};
    const response = await api.get<Customer[]>('/customers', { params });
    return response.data;
  },

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  }
};
