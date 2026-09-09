"use client";

import MuiPopover from "@mui/material/Popover";
import type { SxProps, Theme } from "@mui/material/styles";
import { cloneElement, isValidElement, useRef, useState, type ReactElement, type ReactNode } from "react";

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** Elemento ancla (botón que abre el popover). Debe aceptar `onClick`. */
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
  panelSx?: SxProps<Theme>;
}

export function Popover({ open, onClose, trigger, children, align = "end", className, panelSx }: PopoverProps) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const anchor = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        ref: (node: HTMLElement | null) => {
          anchorRef.current = node;
          setAnchorEl(node);
        },
      })
    : trigger;

  return (
    <span className={className}>
      {anchor}
      <MuiPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: align === "end" ? "right" : "left" }}
        transformOrigin={{ vertical: "top", horizontal: align === "end" ? "right" : "left" }}
        // El "auto height duration" por defecto de Grow escala con la altura del
        // panel (puede superar 300ms en paneles largos como notificaciones), lo
        // que hace que todos los dropdowns del topbar se sientan lentos al abrir.
        // Con una duración fija y corta se sienten instantáneos sin perder la
        // transición.
        transitionDuration={{ enter: 120, exit: 80 }}
        slotProps={{ paper: { sx: [{ minWidth: 192, mt: 1 }, ...(Array.isArray(panelSx) ? panelSx : [panelSx])] } }}
      >
        {children}
      </MuiPopover>
    </span>
  );
}
