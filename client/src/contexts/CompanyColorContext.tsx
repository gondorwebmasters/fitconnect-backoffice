/**
 * CompanyColorContext
 * Manages the primary brand color per company.
 * On mount it restores any saved color from localStorage and applies it to CSS variables.
 * Exposes `setPrimaryColor` so CompanySettings can update the theme instantly on save.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useFitConnectAuth } from './FitConnectAuthContext';
import {
  applyPrimaryColor,
  savePrimaryColor,
  loadPrimaryColor,
} from '@/lib/colorTheme';

const DEFAULT_PRIMARY = '#F97316';

interface CompanyColorContextType {
  primaryColor: string;
  /** Apply + persist a new primary color immediately (no page reload needed) */
  setPrimaryColor: (hex: string) => void;
}

const CompanyColorContext = createContext<CompanyColorContextType>({
  primaryColor: DEFAULT_PRIMARY,
  setPrimaryColor: () => {},
});

export function CompanyColorProvider({ children }: { children: React.ReactNode }) {
  const { activeCompanyId } = useFitConnectAuth();
  const [primaryColor, setPrimaryColorState] = useState<string>(DEFAULT_PRIMARY);

  // Restore saved color whenever the active company changes
  useEffect(() => {
    if (!activeCompanyId) {
      // Reset to default when no company is selected
      applyPrimaryColor(DEFAULT_PRIMARY);
      setPrimaryColorState(DEFAULT_PRIMARY);
      return;
    }
    const saved = loadPrimaryColor(activeCompanyId);
    const color = saved || DEFAULT_PRIMARY;
    setPrimaryColorState(color);
    applyPrimaryColor(color);
  }, [activeCompanyId]);

  const setPrimaryColor = (hex: string) => {
    if (!hex || !hex.startsWith('#')) return;
    setPrimaryColorState(hex);
    applyPrimaryColor(hex);
    if (activeCompanyId) {
      savePrimaryColor(activeCompanyId, hex);
    }
  };

  return (
    <CompanyColorContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </CompanyColorContext.Provider>
  );
}

export function useCompanyColor(): CompanyColorContextType {
  return useContext(CompanyColorContext);
}
