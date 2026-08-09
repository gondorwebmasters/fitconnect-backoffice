"use client";

import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { formatDate, fullName } from "@/lib/format";
import type { Invoice } from "@/lib/graphql/types";

export function AttentionList({
  overdueInvoices,
  pendingUsers,
  loading,
}: {
  overdueInvoices: Invoice[];
  pendingUsers: number;
  loading?: boolean;
}) {
  const t = useTranslations("dashboard.attentionList");

  if (loading) {
    return <Skeleton variant="rounded" height={96} />;
  }

  const empty = overdueInvoices.length === 0 && pendingUsers === 0;

  if (empty) {
    return (
      <Typography variant="body2" sx={{ py: 4, textAlign: "center", color: "text.disabled" }}>
        {t("empty")}
      </Typography>
    );
  }

  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, "& li + li": { borderTop: "1px solid", borderColor: "divider" } }}>
      {pendingUsers > 0 ? (
        <li>
          <Stack
            component={Link}
            href="/members?state=pending"
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ py: 1.5, textDecoration: "none", "&:hover": { bgcolor: "action.hover" } }}
          >
            <Iconify icon="solar:danger-circle-bold" width={15} sx={{ flexShrink: 0, color: "warning.main" }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("pendingRequest", { count: pendingUsers })}
            </Typography>
          </Stack>
        </li>
      ) : null}
      {overdueInvoices.slice(0, 5).map((invoice) => (
        <li key={invoice.id}>
          <Stack
            component={Link}
            href="/billing"
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ py: 1.5, textDecoration: "none", "&:hover": { bgcolor: "action.hover" } }}
          >
            <Iconify icon="solar:danger-circle-bold" width={15} sx={{ flexShrink: 0, color: "error.main" }} />
            <Typography variant="body2" sx={{ flex: 1, color: "text.secondary" }}>
              {t("invoiceOverdue", { number: invoice.invoiceNumber ?? invoice.id.slice(0, 8), name: fullName(invoice.user) })}
            </Typography>
            <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums", color: "text.disabled" }}>
              {t("invoiceDue", { total: invoice.formattedTotal, date: formatDate(invoice.dueDate) })}
            </Typography>
          </Stack>
        </li>
      ))}
    </Box>
  );
}
