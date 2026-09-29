import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

import { varAlpha } from '../../styles';

// ----------------------------------------------------------------------

const MuiBackdrop: Components<Theme>['MuiBackdrop'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: varAlpha(theme.vars.palette.grey['800Channel'], 0.48),
      backdropFilter: 'blur(6px) saturate(140%)',
      WebkitBackdropFilter: 'blur(6px) saturate(140%)',
      '@media (prefers-reduced-transparency: reduce)': {
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        backgroundColor: varAlpha(theme.vars.palette.grey['800Channel'], 0.72),
      },
    }),
    invisible: { background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none' },
  },
};

// ----------------------------------------------------------------------

export const backdrop = { MuiBackdrop };
