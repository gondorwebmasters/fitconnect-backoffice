"use client";

import MuiPagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface PaginationProps {
  /** 0-based, como el resto de la app. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  totalLabel?: string;
}

export function Pagination({ page, pageCount, onChange, totalLabel }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        {totalLabel}
      </Typography>
      <MuiPagination
        size="small"
        page={page + 1}
        count={pageCount}
        onChange={(_event, value) => onChange(value - 1)}
      />
    </Stack>
  );
}
