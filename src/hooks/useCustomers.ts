import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/customer.service';
import type { CustomerWithBilling } from '../types';

export const useCustomers = (initialSearchTerm?: string) => {
  const [customers, setCustomers] = useState<CustomerWithBilling[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm || '');

  const fetchCustomers = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers(search);
      const withBilling = data.map(customer => ({
        ...customer,
        dailyAmount: customer.liters * customer.price,
        monthlyEstimate: customer.liters * customer.price * 30,
      }));
      setCustomers(withBilling);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(searchTerm);
  }, [fetchCustomers, searchTerm]);

  return {
    customers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    fetchCustomers,
    refetch: () => fetchCustomers(searchTerm),
  };
};
