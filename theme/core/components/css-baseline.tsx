import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

import { varAlpha } from '../../styles';

// ----------------------------------------------------------------------

const MuiCssBaseline: Components<Theme>['MuiCssBaseline'] = {
  styleOverrides: (theme) => ({
    html: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
    // Los <button> nativos (Box component="button") traen el borde 3D
    // "outset" del user-agent por defecto — sin este reset se ven como un
    // marco negro alrededor de cualquier botón que no pase por MuiButtonBase.
    button: {
      margin: 0,
      padding: 0,
      border: 'none',
      background: 'none',
      font: 'inherit',
      color: 'inherit',
      cursor: 'pointer',
    },
    // Scrollbars invisibles — el scroll sigue funcionando, solo se oculta la pista
    '*': { scrollbarWidth: 'none' },
    '*::-webkit-scrollbar': { width: 0, height: 0, display: 'none' },
    '::selection': {
      backgroundColor: varAlpha(theme.vars.palette.primary.mainChannel, 1),
      color: theme.vars.palette.primary.contrastText,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': {
        animationDuration: '0.01ms !important',
        animationIterationCount: '1 !important',
        transitionDuration: '0.01ms !important',
      },
    },
  }),
};

// ----------------------------------------------------------------------

export const cssBaseline = { MuiCssBaseline };
