import type { BoxProps } from '@mui/material/Box';

export const logoClasses = {
  root: 'mnl__logo__root',
};

export const TRANSITION = {
  duration: 2,
  ease: [0.43, 0.13, 0.23, 0.96],
};

export const varPath = {
  animate: {
    fillOpacity: [0, 0, 1],
    pathLength: [0, 0.4, 1],
    strokeWidth: [1, 1, 0],
    transition: TRANSITION,
  },
};

export const varPathIn = {
  animate: {
    fillOpacity: [0, 0, 1],
    pathLength: [0, 0.4, 1],
    transition: TRANSITION,
  },
};

export type LogoProps = BoxProps & {
  href?: string;
  disableLink?: boolean;
  height?: number;
  width?: number;
  animated?: boolean;
  textVariant?: boolean;
};
