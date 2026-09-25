import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

import { glass, varAlpha, stylesMode } from '../../styles';

// ----------------------------------------------------------------------

const MuiDialog: Components<Theme>['MuiDialog'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paper: ({ ownerState, theme }) => ({
      ...(!ownerState.fullScreen && {
        // Alert/sheet de iOS 26: cristal más denso que un popover (hay formularios dentro).
        ...glass({ theme, blur: 40, shadow: theme.vars.customShadows.dialog }),
        backgroundColor: varAlpha(theme.vars.palette.background.paperChannel, 0.78),
        [stylesMode.dark]: {
          backgroundColor: varAlpha(theme.vars.palette.background.paperChannel, 0.72),
        },
      }),
      borderRadius: Number(theme.shape.borderRadius) * 3,
      ...(!ownerState.fullScreen && { margin: theme.spacing(2) }),
      // Entrada: 0.96 → 1 + 8 px. La opacidad y la salida las gestiona el
      // Fade de MUI; esto solo añade la "materialización" del panel.
      animation: 'fc-dialog-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
      '@keyframes fc-dialog-in': {
        from: { transform: 'scale(0.96) translateY(8px)' },
        to: { transform: 'none' },
      },
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    }),
    paperFullScreen: { borderRadius: 0 },
  },
};

const MuiDialogTitle: Components<Theme>['MuiDialogTitle'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: ({ theme }) => ({ padding: theme.spacing(3) }) },
};

const MuiDialogContent: Components<Theme>['MuiDialogContent'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({ padding: theme.spacing(0, 3) }),
    dividers: ({ theme }) => ({
      borderTop: 0,
      borderBottomStyle: 'dashed',
      paddingBottom: theme.spacing(3),
    }),
  },
};

const MuiDialogActions: Components<Theme>['MuiDialogActions'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { disableSpacing: true },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
      '& > :not(:first-of-type)': { marginLeft: theme.spacing(1.5) },
    }),
  },
};

// ----------------------------------------------------------------------

export const dialog = {
  MuiDialog,
  MuiDialogTitle,
  MuiDialogContent,
  MuiDialogActions,
};
