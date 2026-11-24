import api from './api';
import type {
  PlatformStats,
  DistributorDetailData,
  CustomerDetailData,
  TransactionItem,
} from '../types';

export const adminService = {
  async getStats(): Promise<PlatformStats> {
    const res = await api.get<PlatformStats>('/distributors/stats');
    return res.data;
  },

  async getDistributors(search?: string, status?: string): Promise<any[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    const res = await api.get('/distributors', { params });
    return res.data;
  },

  async getDistributorDetails(did: string): Promise<DistributorDetailData> {
    const res = await api.get<DistributorDetailData>(`/distributors/${did}`);
    return res.data;
  },

  async updateDistributorStatus(did: string, isActive: boolean): Promise<any> {
    const res = await api.patch(`/distributors/${did}/status`, { isActive });
    return res.data;
  },

  async getCustomers(filter?: {
    distributorId?: string;
    distributorName?: string;
    search?: string;
    status?: string;
  }): Promise<any[]> {
    const params: Record<string, string> = {};
    if (filter?.distributorId) params.distributorId = filter.distributorId;
    if (filter?.distributorName) params.distributorName = filter.distributorName;
    if (filter?.search) params.search = filter.search;
    if (filter?.status && filter.status !== 'all') params.status = filter.status;
    const res = await api.get('/distributors/customers', { params });
    return res.data;
  },

  async getCustomerDetails(cid: string): Promise<CustomerDetailData> {
    const res = await api.get<CustomerDetailData>(`/distributors/customers/${cid}`);
    return res.data;
  },

  async getTransactions(): Promise<{
    summary: {
      totalTransactions: number;
      totalReceivedAmount: number;
      totalBilledAmount: number;
      totalOutstandingAmount: number;
    };
    transactions: TransactionItem[];
  }> {
    const res = await api.get('/distributors/transactions');
    return res.data;
  },
};
