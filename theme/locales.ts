import { esES, ptBR } from '@mui/material/locale';

import type { Localization } from '@mui/material/locale';

// ----------------------------------------------------------------------

// MUI ships no plain "pt" locale — ptBR is the standard stand-in, and what
// Minimals itself maps `pt` to (confirmed against messages/pt.json, which
// uses Brazilian spellings like "usuário"/"tela", not European "utilizador"
// /"ecrã"). There is no English entry: it's MUI's built-in default, and
// next-intl's LOCALES (i18n/locales.ts) only has es/pt.
const MAP: Record<string, Localization> = {
  es: esES,
  pt: ptBR,
};

export function getLocaleComponents(locale: string): Localization {
  return MAP[locale] ?? {};
}
