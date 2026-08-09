'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_ACCENT, isAccentId, type AccentId } from '../accents';

// ----------------------------------------------------------------------

/**
 * Minimal stand-in for Minimals' SettingsState. The stock template carries
 * navLayout/navColor/compactLayout/direction/fontFamily/contrast — none of
 * which this app exposes, so only the one field the theme actually reads
 * (the accent) survives. Keeping the type/hook names lets the ported
 * theme code (create-theme.ts, with-settings/update-theme.ts) change only
 * its import path, not its shape.
 */
export type SettingsState = {
  primaryColor: AccentId;
};

export const defaultSettings: SettingsState = {
  primaryColor: DEFAULT_ACCENT,
};

export const ACCENT_STORAGE_KEY = 'fc-bo-accent';
const STORAGE_KEY = ACCENT_STORAGE_KEY;

type SettingsContextValue = SettingsState & {
  setPrimaryColor: (accent: AccentId) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function readStoredAccent(): AccentId {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw && isAccentId(raw) ? raw : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState<AccentId>(readStoredAccent);

  const setPrimaryColor = useCallback((accent: AccentId) => {
    setPrimaryColorState(accent);
    try {
      window.localStorage.setItem(STORAGE_KEY, accent);
    } catch {
      // localStorage unavailable (strict private mode) — accent still works in-memory
    }
  }, []);

  const value = useMemo(
    () => ({ primaryColor, setPrimaryColor }),
    [primaryColor, setPrimaryColor]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext: Context must be used inside SettingsProvider');
  }
  return context;
}
