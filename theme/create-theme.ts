import type { Theme } from '@mui/material/styles';

import { createTheme as muiCreateTheme } from '@mui/material/styles';

import { overridesTheme } from './overrides-theme';
import { shadows, typography, components, colorSchemes, customShadows } from './core';
import { updateCoreWithSettings } from './with-settings/update-theme';

import type { SettingsState } from './settings';
import type { ThemeLocaleComponents, ThemeUpdateOptions } from './types';

// ----------------------------------------------------------------------

export function createTheme(
  localeComponents: ThemeLocaleComponents,
  settings: SettingsState
): Theme {
  const initialTheme: ThemeUpdateOptions = {
    colorSchemes: {
      light: { ...colorSchemes.light, customShadows: customShadows('light') },
      dark: { ...colorSchemes.dark, customShadows: customShadows('dark') },
    },
    // The 25-entry elevation array cannot be scoped per color scheme — it's
    // alpha-based, so it reads acceptably in both. Scheme-specific shadow
    // *colors* (card/dialog/dropdown/primary/…) live in customShadows above.
    shadows: shadows('light'),
    shape: { borderRadius: 8 },
    components,
    typography,
    cssVariables: {
      cssVarPrefix: '',
      // Must match InitColorSchemeScript's `attribute` default
      // (theme/color-scheme-script usage in app/layout.tsx) — otherwise the
      // stylesMode.dark selectors baked into every core/components/*
      // override match nothing and dark mode silently half-breaks.
      colorSchemeSelector: '[data-mui-color-scheme="%s"]',
      shouldSkipGeneratingVar,
    },
  };

  const updatedTheme = updateCoreWithSettings(initialTheme, settings);

  return muiCreateTheme(updatedTheme, localeComponents, overridesTheme);
}

// ----------------------------------------------------------------------

function shouldSkipGeneratingVar(keys: string[], value: string | number): boolean {
  const skipGlobalKeys = [
    'mixins',
    'overlays',
    'direction',
    'breakpoints',
    'cssVarPrefix',
    'unstable_sxConfig',
    'typography',
  ];

  const skipPaletteKeys: {
    [key: string]: string[];
  } = {
    global: ['tonalOffset', 'dividerChannel', 'contrastThreshold'],
    grey: ['A100', 'A200', 'A400', 'A700'],
    text: ['icon'],
  };

  const isPaletteKey = keys[0] === 'palette';

  if (isPaletteKey) {
    const paletteType = keys[1];
    const skipKeys = skipPaletteKeys[paletteType] || skipPaletteKeys.global;

    return keys.some((key) => skipKeys?.includes(key));
  }

  return keys.some((key) => skipGlobalKeys?.includes(key));
}
