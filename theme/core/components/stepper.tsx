import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

// ----------------------------------------------------------------------

const MuiStepConnector: Components<Theme>['MuiStepConnector'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { line: ({ theme }) => ({ borderColor: theme.vars.palette.divider }) },
};

// ----------------------------------------------------------------------

export const stepper = { MuiStepConnector };
