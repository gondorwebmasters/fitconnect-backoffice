"use client";

import MuiChip from "@mui/material/Chip";
import type { ChipProps as MuiChipProps } from "@mui/material/Chip";
import type { ReactNode } from "react";

type ChipTone = "default" | "primary" | "success" | "warning" | "error";

const TONE_COLOR: Record<ChipTone, MuiChipProps["color"]> = {
  default: "default",
  primary: "primary",
  success: "success",
  warning: "warning",
  error: "error",
};

interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
  onRemove?: () => void;
  className?: string;
  sx?: MuiChipProps["sx"];
}

export function Chip({ children, tone = "default", onRemove, className, sx }: ChipProps) {
  return (
    <MuiChip
      className={className}
      size="small"
      variant="soft"
      color={TONE_COLOR[tone]}
      label={children}
      onDelete={onRemove}
      sx={{ maxWidth: 192, ...sx }}
    />
  );
}
