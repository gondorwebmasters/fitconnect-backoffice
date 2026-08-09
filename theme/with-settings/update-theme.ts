import type { ColorSystemOptions } from '@mui/material/styles';

import { getAccentPalette } from '../accents';
import { createShadowColor } from '../core/custom-shadows';

import type { SettingsState } from '../settings';
import type { ThemeUpdateOptions } from '../types';

// ----------------------------------------------------------------------

/**
 * Injects the selected accent as `palette.primary` into BOTH color schemes
 * (the source template only did this for one scheme — an asymmetry that
 * left dark mode always on the default accent, which this fixes) and
 * derives the matching `customShadows.primary` glow color.
 */
export function updateCoreWithSettings(
  theme: ThemeUpdateOptions,
  settings: SettingsState
): ThemeUpdateOptions {
  const { colorSchemes } = theme;
  const accentPalette = getAccentPalette(settings.primaryColor);
  const primaryShadow = createShadowColor(accentPalette.mainChannel);

  // create-theme.ts always builds these as plain objects, never the
  // `true|false` shorthand `colorSchemes` also accepts.
  const light = colorSchemes?.light as ColorSystemOptions | undefined;
  const dark = colorSchemes?.dark as ColorSystemOptions | undefined;

  return {
    ...theme,
    colorSchemes: {
      ...colorSchemes,
      light: {
        ...light,
        palette: { ...light?.palette, primary: accentPalette },
        customShadows: { ...light?.customShadows, primary: primaryShadow },
      },
      dark: {
        ...dark,
        palette: { ...dark?.palette, primary: accentPalette },
        customShadows: { ...dark?.customShadows, primary: primaryShadow },
      },
    },
  };
}
