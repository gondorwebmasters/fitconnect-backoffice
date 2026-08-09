import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

// ----------------------------------------------------------------------

const MuiStack: Components<Theme>['MuiStack'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { useFlexGap: true },
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {},
};

// ----------------------------------------------------------------------

export const stack = { MuiStack };
