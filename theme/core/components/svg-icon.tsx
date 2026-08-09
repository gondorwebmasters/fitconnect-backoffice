import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

// ----------------------------------------------------------------------

const MuiSvgIcon: Components<Theme>['MuiSvgIcon'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { fontSizeLarge: { width: 32, height: 32, fontSize: 'inherit' } },
};

// ----------------------------------------------------------------------

export const svgIcon = { MuiSvgIcon };
