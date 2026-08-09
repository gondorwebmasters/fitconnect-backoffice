'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useLocale } from 'next-intl';
import { useMemo, type ReactNode } from 'react';

import { createTheme } from './create-theme';
import { getLocaleComponents } from './locales';
import { SettingsProvider, useSettingsContext } from './settings';

// ----------------------------------------------------------------------

function Theme({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const settings = useSettingsContext();

  const theme = useMemo(
    () => createTheme(getLocaleComponents(locale), settings),
    [locale, settings.primaryColor]
  );

  return (
    <MuiThemeProvider theme={theme} defaultMode="system" modeStorageKey="fc-bo-mode">
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <Theme>{children}</Theme>
    </SettingsProvider>
  );
}
