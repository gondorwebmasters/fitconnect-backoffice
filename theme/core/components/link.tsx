import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

// ----------------------------------------------------------------------

const MuiLink: Components<Theme>['MuiLink'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { underline: 'hover' },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {},
};

// ----------------------------------------------------------------------

export const link = { MuiLink };
