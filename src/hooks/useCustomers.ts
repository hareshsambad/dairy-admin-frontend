import { useState, useEffect, useCallback, useRef } from 'react';
import { customerService } from '../services/customer.service';
import type { CustomerWithBilling } from '../types';

// Global in-memory cache to eliminate loading flashing when switching tabs
let cachedCustomers: CustomerWithBilling[] | null = null;
let lastFetchedTimestamp = 0;
const CACHE_TTL_MS = 45 * 1000; // 45 seconds stale-while-revalidate

export function invalidateCustomerCache() {
  cachedCustomers = null;
  lastFetchedTimestamp = 0;
}

export const useCustomers = (initialSearchTerm?: string) => {
  const [customers, setCustomers] = useState<CustomerWithBilling[]>(
    () => (initialSearchTerm ? [] : cachedCustomers || [])
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (initialSearchTerm) return true;
    return cachedCustomers === null;
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm || '');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(async (search?: string, force = false) => {
    const term = search?.trim() || '';
    const isSearchQuery = term.length > 0;
    const now = Date.now();

    // Instant cache hit if no search term and cache is fresh
    if (!isSearchQuery && !force && cachedCustomers && now - lastFetchedTimestamp < CACHE_TTL_MS) {
      setCustomers(cachedCustomers);
      setIsLoading(false);
      return;
    }

    // Only show full loader if there is no current data
    if (!cachedCustomers && customers.length === 0) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await customerService.getCustomers(term || undefined);
      const withBilling = data.map((customer) => {
        const liters = Number(customer.liters) || 0;
        const price = Number(customer.price) || 0;
        const dailyAmount = Math.round((liters * price + Number.EPSILON) * 100) / 100;
        const monthlyEstimate = Math.round((dailyAmount * 30 + Number.EPSILON) * 100) / 100;
        return {
          ...customer,
          dailyAmount,
          monthlyEstimate,
        };
      });

      if (!isSearchQuery) {
        cachedCustomers = withBilling;
        lastFetchedTimestamp = Date.now();
      }

      setCustomers(withBilling);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  }, [customers.length]);

  // Debounced search trigger (250ms) to avoid request thrashing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchCustomers, searchTerm]);

  return {
    customers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    fetchCustomers: (search?: string) => fetchCustomers(search, true),
    refetch: () => fetchCustomers(searchTerm, true),
  };
};
