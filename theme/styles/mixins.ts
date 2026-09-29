import type { CSSObject, Theme } from '@mui/material/styles';

import { dividerClasses } from '@mui/material/Divider';
import { checkboxClasses } from '@mui/material/Checkbox';
import { menuItemClasses } from '@mui/material/MenuItem';
import { autocompleteClasses } from '@mui/material/Autocomplete';

import { remToPx, varAlpha, mediaQueries, stylesMode } from './utils';

// ----------------------------------------------------------------------

/**
 * Usage:
 * ...hideScrollX,
 * ...hideScrollY,
 */
export const hideScrollX: CSSObject = {
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  overflowX: 'auto',
  '&::-webkit-scrollbar': { display: 'none' },
};

export const hideScrollY: CSSObject = {
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  overflowY: 'auto',
  '&::-webkit-scrollbar': { display: 'none' },
};

/**
 * Usage:
 * ...textGradient(`to right, ${theme.vars.palette.text.primary}, ${alpha(theme.vars.palette.text.primary, 0.2)}`
 */
export function textGradient(color: string): CSSObject {
  return {
    background: `linear-gradient(${color})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    color: 'transparent',
  };
}

/**
 * Usage:
 * ...borderGradient({ color: `to right, ${theme.vars.palette.text.primary}, ${alpha(theme.vars.palette.text.primary, 0.2)}`, padding: '4px' }),
 */
export type BorderGradientProps = {
  color?: string;
  padding?: string;
};

export function borderGradient(props?: BorderGradientProps): CSSObject {
  return {
    inset: 0,
    width: '100%',
    content: '""',
    height: '100%',
    margin: 'auto',
    position: 'absolute',
    borderRadius: 'inherit',
    padding: props?.padding ?? '2px',
    //
    mask: 'linear-gradient(#FFF 0 0) content-box, linear-gradient(#FFF 0 0)',
    WebkitMask: 'linear-gradient(#FFF 0 0) content-box, linear-gradient(#FFF 0 0)',
    maskComposite: 'exclude',
    WebkitMaskComposite: 'xor',
    ...(props?.color && {
      background: `linear-gradient(${props.color})`,
    }),
  };
}

/**
 * Usage:
 * ...bgGradient({ color: `to right, ${theme.vars.palette.grey[900]} 25%, ${varAlpha(theme.vars.palette.primary.darkerChannel, 0.88)}`, imgUrl: '/assets/background/overlay.png' }),
 */
export type BgGradientProps = {
  color: string;
  imgUrl?: string;
};

export function bgGradient({ color, imgUrl }: BgGradientProps): CSSObject {
  if (imgUrl) {
    return {
      background: `linear-gradient(${color}), url(${imgUrl})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
    };
  }
  return { background: `linear-gradient(${color})` };
}

/**
 * Usage:
 * ...bgBlur({ color: `varAlpha(theme.vars.palette.background.paperChannel, 0.8)`, imgUrl: '/assets/background/overlay.png', blur: 6 }),
 */
export type BgBlurProps = {
  color: string;
  blur?: number;
  imgUrl?: string;
};

export function bgBlur({ color, blur = 6, imgUrl }: BgBlurProps): CSSObject {
  if (imgUrl) {
    return {
      position: 'relative',
      backgroundImage: `url(${imgUrl})`,
      '&::before': {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9,
        content: '""',
        width: '100%',
        height: '100%',
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        backgroundColor: color,
      },
    };
  }
  return {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    backgroundColor: color,
  };
}

/**
 * Usage:
 * ...maxLine({ line: 2, persistent: theme.typography.caption }),
 */
export type MediaFontSize = {
  [key: string]: {
    fontSize: React.CSSProperties['fontSize'];
  };
};

export type MaxLineProps = {
  line: number;
  persistent?: Partial<React.CSSProperties>;
};

function getFontSize(fontSize: React.CSSProperties['fontSize']) {
  return typeof fontSize === 'string' ? remToPx(fontSize) : fontSize;
}

function getLineHeight(lineHeight: React.CSSProperties['lineHeight'], fontSize?: number) {
  if (typeof lineHeight === 'string') {
    return fontSize ? remToPx(lineHeight) / fontSize : 1;
  }
  return lineHeight;
}

export function maxLine({ line, persistent }: MaxLineProps): CSSObject {
  const baseStyles: CSSObject = {
    overflow: 'hidden',
    display: '-webkit-box',
    textOverflow: 'ellipsis',
    WebkitLineClamp: line,
    WebkitBoxOrient: 'vertical',
  };

  if (persistent) {
    const fontSizeBase = getFontSize(persistent.fontSize);
    const fontSizeSm = getFontSize((persistent as MediaFontSize)[mediaQueries.upSm]?.fontSize);
    const fontSizeMd = getFontSize((persistent as MediaFontSize)[mediaQueries.upMd]?.fontSize);
    const fontSizeLg = getFontSize((persistent as MediaFontSize)[mediaQueries.upLg]?.fontSize);

    const lineHeight = getLineHeight(persistent.lineHeight, fontSizeBase);

    return {
      ...baseStyles,
      ...(lineHeight && {
        ...(fontSizeBase && { height: fontSizeBase * lineHeight * line }),
        ...(fontSizeSm && { [mediaQueries.upSm]: { height: fontSizeSm * lineHeight * line } }),
        ...(fontSizeMd && { [mediaQueries.upMd]: { height: fontSizeMd * lineHeight * line } }),
        ...(fontSizeLg && { [mediaQueries.upLg]: { height: fontSizeLg * lineHeight * line } }),
      }),
    };
  }

  return baseStyles;
}


/**
 * Liquid Glass (iOS 26): material translúcido con refracción simulada.
 * - Blur + saturación alta: el fondo "se dobla" y se intensifica bajo el cristal.
 * - Brillo especular: borde superior/izquierdo luminoso (luz cayendo sobre el vidrio)
 *   y sombra interior inferior (grosor del cristal), vía box-shadow inset.
 * - `tint` colorea el cristal (alerts); `clear` lo hace casi transparente (sobre media).
 * Cae a superficie sólida con `prefers-reduced-transparency` y refuerza borde con
 * `prefers-contrast: more`.
 *
 * Usage: ...glass({ theme, blur: 24, tint: theme.vars.palette.success.mainChannel })
 */
type GlassProps = {
  theme: Theme;
  blur?: number;
  /** Canal RGB ("r g b") para teñir el cristal. */
  tint?: string;
  /** Sombra exterior (por defecto sutil). */
  shadow?: string;
};

export function glass({ theme, blur = 24, tint, shadow }: GlassProps): CSSObject {
  const white = theme.vars.palette.common.whiteChannel;
  const black = theme.vars.palette.common.blackChannel;
  // Sin tinte, el cristal toma el color de la superficie del tema (blanco en
  // claro, azul-grafito en oscuro) en vez de blanco fijo → sigue al modo del sistema.
  const surface = theme.vars.palette.background.paperChannel;
  const lightBg = tint ? varAlpha(tint, 0.16) : varAlpha(surface, 0.7);
  const darkBg = tint ? varAlpha(tint, 0.22) : varAlpha(surface, 0.62);
  // Mismo color que el contorno de los inputs (textfield.tsx → notchedOutline).
  const fieldBorder = varAlpha(theme.vars.palette.grey['500Channel'], 0.2);
  const filter = `blur(${blur}px) saturate(180%) brightness(1.04)`;

  return {
    backgroundColor: lightBg,
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: `1px solid ${fieldBorder}`,
    boxShadow: [
      shadow ?? `0 8px 32px ${varAlpha(black, 0.12)}`,
      `inset 0 1px 0 ${varAlpha(white, 0.85)}`, // borde superior: luz especular
      `inset 1px 0 0 ${varAlpha(white, 0.35)}`,
      `inset 0 -1px 0 ${varAlpha(black, 0.06)}`, // grosor del cristal
    ].join(', '),
    [stylesMode.dark]: {
      backgroundColor: darkBg,
      // Sin bordes blancos en oscuro: mismo borde que los campos.
      border: `1px solid ${fieldBorder}`,
      boxShadow: [shadow ?? `0 8px 32px ${varAlpha(black, 0.4)}`, `inset 0 -1px 0 ${varAlpha(black, 0.3)}`].join(', '),
    },
    '@media (prefers-reduced-transparency: reduce)': {
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      backgroundColor: theme.vars.palette.background.paper,
    },
    '@media (prefers-contrast: more)': {
      border: `1px solid ${theme.vars.palette.divider}`,
    },
  };
}

/**
 * Botón de cristal circular para barras (iOS 26 toolbar button): hover ilumina,
 * pulsación lo hunde. Solo transform/background → compositor.
 */
export function glassButton(theme: Theme): CSSObject {
  return {
    ...glass({ theme, blur: 16, shadow: `0 2px 10px ${varAlpha(theme.vars.palette.common.blackChannel, 0.08)}` }),
    width: 40,
    height: 40,
    borderRadius: '50%',
    color: theme.vars.palette.text.secondary,
    transition:
      'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      color: theme.vars.palette.text.primary,
      backgroundColor: varAlpha(theme.vars.palette.common.whiteChannel, 0.82),
      [stylesMode.dark]: { backgroundColor: varAlpha(theme.vars.palette.common.whiteChannel, 0.16) },
    },
    '&:active': { transform: 'scale(0.92)', transition: 'transform 80ms ease-out' },
    '@media (prefers-reduced-motion: reduce)': { '&:active': { transform: 'none' } },
  };
}

/**
 * Usage:
 * ...paper({ theme, color: varAlpha(theme.vars.palette.background.paperChannel, 0.9), dropdown: true }),
 */
type PaperProps = {
  theme: Theme;
  color?: string;
  dropdown?: boolean;
};

export function paper({ theme, color, dropdown }: PaperProps) {
  return {
    ...glass({ theme, blur: dropdown ? 24 : 32 }),
    ...(color && { backgroundColor: color }),
    ...(dropdown && {
      padding: theme.spacing(0.5),
      borderRadius: `${Number(theme.shape.borderRadius) * 1.75}px`,
    }),
  };
}

/**
 * Usage:
 * ...menuItem(theme)
 */
export function menuItem(theme: Theme) {
  return {
    ...theme.typography.body2,
    transition: 'background-color 120ms cubic-bezier(0.4, 0, 0.2, 1), color 120ms cubic-bezier(0.4, 0, 0.2, 1)',
    padding: theme.spacing(0.75, 1),
    borderRadius: Number(theme.shape.borderRadius) * 0.75,
    '&:not(:last-of-type)': { marginBottom: 4 },
    [`&.${menuItemClasses.selected}`]: {
      fontWeight: theme.typography.fontWeightSemiBold,
      backgroundColor: theme.vars.palette.action.selected,
      '&:hover': { backgroundColor: theme.vars.palette.action.hover },
    },
    [`& .${checkboxClasses.root}`]: {
      padding: theme.spacing(0.5),
      marginLeft: theme.spacing(-0.5),
      marginRight: theme.spacing(0.5),
    },
    [`&.${autocompleteClasses.option}[aria-selected="true"]`]: {
      backgroundColor: theme.vars.palette.action.selected,
      '&:hover': { backgroundColor: theme.vars.palette.action.hover },
    },
    [`&+.${dividerClasses.root}`]: { margin: theme.spacing(0.5, 0) },
  };
}
