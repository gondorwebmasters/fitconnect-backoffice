"use client";
import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function SlideOver({ open, onClose, title, subtitle, children, footer, wide }: SlideOverProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: 1, sm: wide ? 640 : 480 } } } }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ px: 4, py: 3 }}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" sx={{ color: "text.disabled", mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose} aria-label="Cerrar panel" size="small">
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", px: 4, py: 1 }}>{children}</Box>

      {footer ? (
        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ borderTop: 1, borderColor: "divider", px: 4, py: 2 }}>
          {footer}
        </Stack>
      ) : null}
    </Drawer>
  );
}
