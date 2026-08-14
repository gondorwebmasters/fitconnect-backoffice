import type { Components } from '@mui/material/styles';
import type { Theme } from '../../types';

import { inputBaseClasses } from '@mui/material/InputBase';
import { filledInputClasses } from '@mui/material/FilledInput';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';

import { varAlpha } from '../../styles';

// ----------------------------------------------------------------------

// Nombre literal (no generado) para que components/phone-input pueda
// comparar `event.animationName` contra la misma cadena vía `onAnimationStart`.
export const AUTOFILL_ANIMATION_NAME = 'mui-auto-fill';

const MuiInputBase: Components<Theme>['MuiInputBase'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${inputBaseClasses.disabled}`]: {
        '& svg': { color: theme.vars.palette.text.disabled },
      },
    }),
    input: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(15),
      [theme.breakpoints.down('sm')]: {
        // This will prevent zoom in Safari min font size ~ 16px
        fontSize: theme.typography.pxToRem(16),
      },
      '&::placeholder': {
        opacity: 1,
        color: theme.vars.palette.text.disabled,
      },
      // El navegador pinta el fondo autocompletado con su propio color (a
      // menudo amarillo) vía :-webkit-autofill; se sobreescribe con
      // transparente para que, una vez relleno, no quede ningún tinte
      // "pegado" — se ve igual que cualquier otro campo del sistema (que no
      // tienen fondo propio). La animación de 1ms no se ve, pero dispara
      // `onAnimationStart` — el único evento fiable para detectar un
      // autorrelleno del navegador (no siempre dispara `onChange`, ver
      // components/phone-input).
      '&:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 100px transparent inset',
        WebkitTextFillColor: theme.vars.palette.text.primary,
        caretColor: theme.vars.palette.text.primary,
        borderRadius: 'inherit',
        transition: 'background-color 5000s ease-in-out 0s',
        animationName: AUTOFILL_ANIMATION_NAME,
        animationDuration: '1ms',
      },
      [`@keyframes ${AUTOFILL_ANIMATION_NAME}`]: { from: {}, to: {} },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiInput: Components<Theme>['MuiInput'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    underline: ({ theme }) => ({
      '&::before': { borderBottomColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.32) },
      '&::after': { borderBottomColor: theme.vars.palette.text.primary },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiOutlinedInput: Components<Theme>['MuiOutlinedInput'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${outlinedInputClasses.focused}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.text.primary,
        },
      },
      [`&.${outlinedInputClasses.error}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.error.main,
        },
      },
      [`&.${outlinedInputClasses.disabled}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.action.disabledBackground,
        },
      },
    }),
    notchedOutline: ({ theme }) => ({
      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.2),
      transition: theme.transitions.create(['border-color'], {
        duration: theme.transitions.duration.shortest,
      }),
    }),
  },
};

// ----------------------------------------------------------------------

const MuiFilledInput: Components<Theme>['MuiFilledInput'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { disableUnderline: true },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
      '&:hover': { backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16) },
      [`&.${filledInputClasses.focused}`]: {
        backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
      },
      [`&.${filledInputClasses.error}`]: {
        backgroundColor: varAlpha(theme.vars.palette.error.mainChannel, 0.08),
        [`&.${filledInputClasses.focused}`]: {
          backgroundColor: varAlpha(theme.vars.palette.error.mainChannel, 0.16),
        },
      },
      [`&.${filledInputClasses.disabled}`]: {
        backgroundColor: theme.vars.palette.action.disabledBackground,
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const textfield = {
  MuiInput,
  MuiInputBase,
  MuiFilledInput,
  MuiOutlinedInput,
};
