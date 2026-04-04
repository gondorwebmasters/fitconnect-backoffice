import { useEffect, useRef } from 'react';

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
  // Store the refetch function in a ref to avoid including it in the dependency array
  const refetchRef = useRef(refetchFn);
  
  // Update the ref whenever the function changes
  useEffect(() => {
    refetchRef.current = refetchFn;
  }, [refetchFn]);

  // Only refetch when activeCompanyId changes, not when refetchFn changes
  useEffect(() => {
    refetchRef.current();
  }, [activeCompanyId]); // Only depend on activeCompanyId
}
