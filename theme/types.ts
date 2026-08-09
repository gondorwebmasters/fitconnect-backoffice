import type {
  Theme as BaseTheme,
  CssVarsTheme,
  CssVarsThemeOptions,
  ThemeOptions,
  TypographyVariantsOptions,
} from '@mui/material/styles';
import type { Localization } from '@mui/material/locale';

// Augments Components<Theme> with MuiDatePicker/MuiTimePicker/… keys, used
// by theme/core/components/mui-x-date-picker.tsx.
import type {} from '@mui/x-date-pickers/themeAugmentation';

// Tells @mui/material's own `Theme` type (the one every file gets by
// default from '@mui/material/styles', with no import gymnastics) that CSS
// vars are always enabled here — this makes `theme.vars` non-optional
// ambiently project-wide, instead of requiring every file to import our
// local `Theme` alias below just to avoid `theme.vars` being `possibly
// undefined`. See node_modules/@mui/material/styles/createThemeNoVars.d.ts.
declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true;
  }
}

// ----------------------------------------------------------------------

export type Theme = Omit<BaseTheme, 'palette' | 'applyStyles'> & CssVarsTheme;

// Based on the top-level `ThemeOptions` (not `CssVarsThemeOptions`) because
// only `ThemeOptions` carries the `cssVariables` config object that
// create-theme.ts sets (colorSchemeSelector, cssVarPrefix,
// shouldSkipGeneratingVar).
export type ThemeUpdateOptions = Omit<ThemeOptions, 'typography'> & {
  typography?: TypographyVariantsOptions;
};

export type ThemeComponents = CssVarsThemeOptions['components'];

export type ThemeColorScheme = 'light' | 'dark';

export type ThemeDirection = 'ltr' | 'rtl';

export type ThemeLocaleComponents = Localization;
