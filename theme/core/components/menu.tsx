import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

import { menuItem } from '../../styles';

// ----------------------------------------------------------------------

const MuiMenuItem: Components<Theme>['MuiMenuItem'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: ({ theme }) => ({ ...menuItem(theme) }) },
};

// ----------------------------------------------------------------------

export const menu = { MuiMenuItem };
