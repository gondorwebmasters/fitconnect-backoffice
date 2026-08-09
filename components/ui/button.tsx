"use client";

import MuiButton from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_MAP: Record<Variant, { variant: MuiButtonProps["variant"]; color: MuiButtonProps["color"] }> = {
  primary: { variant: "contained", color: "primary" },
  secondary: { variant: "outlined", color: "inherit" },
  ghost: { variant: "text", color: "inherit" },
  danger: { variant: "outlined", color: "error" },
};

interface ButtonProps extends Omit<MuiButtonProps, "variant" | "color" | "size"> {
  variant?: Variant;
  size?: "sm" | "md";
}

export function Button({ variant = "secondary", size = "md", sx, ...props }: ButtonProps) {
  const mapped = VARIANT_MAP[variant];
  return (
    <MuiButton
      variant={mapped.variant}
      color={mapped.color}
      size={size === "sm" ? "small" : "medium"}
      sx={{ gap: 0.75, ...sx }}
      {...props}
    />
  );
}
