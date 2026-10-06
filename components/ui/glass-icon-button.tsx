"use client";

import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import { forwardRef } from "react";

import { glassButton } from "@/theme/styles";

/** Botón circular de Liquid Glass para barras y cabeceras (iOS 26). */
export const GlassIconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function GlassIconButton(
  { sx, ...props },
  ref,
) {
  return (
    <IconButton
      ref={ref}
      {...props}
      sx={[(theme) => glassButton(theme as never), ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
});
