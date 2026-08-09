'use client';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Locale } from 'date-fns';
import { es, pt } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

const DATE_FNS_LOCALES: Record<string, Locale> = { es, pt };

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();

  return (
    <MuiLocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={DATE_FNS_LOCALES[locale] ?? es}>
      {children}
    </MuiLocalizationProvider>
  );
}
