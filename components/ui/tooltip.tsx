"use client";

import MuiTooltip from "@mui/material/Tooltip";
import type { ReactElement, ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  /** Retraso antes de mostrar, en ms. */
  delay?: number;
}

export function Tooltip({ content, children, delay = 250 }: TooltipProps) {
  return (
    <MuiTooltip title={content} enterDelay={delay} arrow>
      {children}
    </MuiTooltip>
  );
}
