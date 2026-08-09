"use client";

import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import MuiMenuItem from "@mui/material/MenuItem";
import { useState, type ReactNode } from "react";

import { Popover } from "./popover";

interface MenuProps {
  /** Render del botón disparador; recibe el estado abierto. */
  trigger: (open: boolean) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
}

export function Menu({ trigger, children, align = "end" }: MenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      align={align}
      trigger={<div onClick={() => setOpen((value) => !value)}>{trigger(open)}</div>}
    >
      <div onClick={() => setOpen(false)}>{children}</div>
    </Popover>
  );
}

interface MenuItemProps {
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
}

export function MenuItem({ onClick, icon, children, tone = "default", disabled }: MenuItemProps) {
  return (
    <MuiMenuItem onClick={onClick} disabled={disabled} sx={tone === "danger" ? { color: "error.main" } : undefined}>
      {icon ? <ListItemIcon sx={{ color: "inherit" }}>{icon}</ListItemIcon> : null}
      {children}
    </MuiMenuItem>
  );
}

export function MenuSeparator() {
  return <Divider sx={{ my: 0.5 }} />;
}
