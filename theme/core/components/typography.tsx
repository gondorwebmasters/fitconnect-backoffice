import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

// ----------------------------------------------------------------------

const MuiTypography: Components<Theme>['MuiTypography'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paragraph: ({ theme }) => ({ marginBottom: theme.spacing(2) }),
    gutterBottom: ({ theme }) => ({ marginBottom: theme.spacing(1) }),
  },
};

// ----------------------------------------------------------------------

export const typography = { MuiTypography };
