'use client';

import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import NoSsr from '@mui/material/NoSsr';
import Image from 'next/image';

import appIcon from '@/assets/icon.png';
import { RouterLink } from '@/routes/components';

import { logoClasses } from './classes';

import type { LogoProps } from './classes';

// ----------------------------------------------------------------------

/**
 * Adaptado del logo animado de Minimals (arte SVG propio de la plantilla,
 * no de FitConnect) al icono real de la app — mismo API (`href`,
 * `disableLink`, `height`, `sx`) para poder usarse como reemplazo directo
 * en cualquier sitio que antes montaba `<Image src={appIcon}>` a mano.
 */
export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ href = '/', disableLink = false, height = 40, width, className, sx, ...other }, ref) => {
    const size = width ?? height;

    const logo = (
      <Box
        sx={{
          height,
          width: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...sx,
        }}
      >
        <Image src={appIcon} alt="" width={size} height={height} style={{ borderRadius: 5, objectFit: 'contain' }} priority />
      </Box>
    );

    if (disableLink) {
      return (
        <NoSsr fallback={<Box ref={ref} sx={{ height, width: size }} />}>
          <Box
            ref={ref}
            className={logoClasses.root.concat(className ? ` ${className}` : '')}
            aria-label="logo"
            sx={{ display: 'inline-flex', verticalAlign: 'middle', pointerEvents: 'none' }}
            {...other}
          >
            {logo}
          </Box>
        </NoSsr>
      );
    }

    return (
      <NoSsr fallback={<Box ref={ref} sx={{ height, width: size }} />}>
        <Box
          ref={ref}
          component={RouterLink}
          href={href}
          className={logoClasses.root.concat(className ? ` ${className}` : '')}
          aria-label="logo"
          sx={{ display: 'inline-flex', verticalAlign: 'middle' }}
          {...other}
        >
          {logo}
        </Box>
      </NoSsr>
    );
  }
);

Logo.displayName = 'Logo';
