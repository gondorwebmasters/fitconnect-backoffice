import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

import { tooltipClasses } from '@mui/material/Tooltip';

import { glass, varAlpha, stylesMode } from '../../styles';

// ----------------------------------------------------------------------

const MuiTooltip: Components<Theme>['MuiTooltip'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    tooltip: ({ theme }) => ({
      ...glass({ theme, blur: 16 }),
      backgroundColor: varAlpha(theme.vars.palette.grey['800Channel'], 0.72),
      color: theme.vars.palette.common.white,
      letterSpacing: '0.01em',
      [stylesMode.dark]: {
        backgroundColor: varAlpha(theme.vars.palette.grey['700Channel'], 0.6),
      },
    }),
    arrow: { display: 'none' },
    popper: {
      [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: {
        marginTop: 12,
      },
      [`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]: {
        marginBottom: 12,
      },
      [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]: {
        marginLeft: 12,
      },
      [`&.${tooltipClasses.popper}[data-popper-placement*="left"] .${tooltipClasses.tooltip}`]: {
        marginRight: 12,
      },
    },
  },
};

// ----------------------------------------------------------------------

export const tooltip = { MuiTooltip };
