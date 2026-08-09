import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mb: 4 }}>
      <Box>
        <Typography variant="h4">{title}</Typography>
        <Box sx={{ mt: 1 }}>
          <Breadcrumbs />
        </Box>
        {subtitle ? (
          <Typography variant="body2" sx={{ color: "text.disabled", mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
