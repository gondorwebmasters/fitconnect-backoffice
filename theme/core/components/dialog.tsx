import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

// ----------------------------------------------------------------------

const MuiDialog: Components<Theme>['MuiDialog'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paper: ({ ownerState, theme }) => ({
      boxShadow: theme.vars.customShadows.dialog,
      borderRadius: Number(theme.shape.borderRadius) * 2,
      ...(!ownerState.fullScreen && { margin: theme.spacing(2) }),
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
