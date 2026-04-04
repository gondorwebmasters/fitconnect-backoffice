import { useEffect } from 'react';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';

/**
 * Hook that calls a refetch function whenever the active company changes.
 * Use this in pages that fetch data to ensure all data refreshes when switching companies.
 * 
 * Example:
 * ```tsx
 * const { activeCompanyId } = useFitConnectAuth();
 * useRefreshOnCompanyChange(activeCompanyId, fetchUsers);
 * ```
 */
export function useRefreshOnCompanyChange(
  activeCompanyId: string | null,
  refetchFn: () => void | Promise<void>
) {
  useEffect(() => {
    // Refetch data whenever activeCompanyId changes
    refetchFn();
  }, [activeCompanyId, refetchFn]);
}
