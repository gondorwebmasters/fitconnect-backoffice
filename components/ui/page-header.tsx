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
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "flex-end" }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 4 }}
    >
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
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          spacing={1.5}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
