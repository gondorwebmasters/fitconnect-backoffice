"use client";

import { useMutation, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import { StatusChip } from "@/components/mui/status-chip";
import { useToast } from "@/components/ui/toast";
import { formatCents, formatDate, formatDateTime } from "@/lib/format";
import {
  LIST_USER_INVOICES,
  LIST_USER_TRANSACTIONS,
  REFUND_TRANSACTION,
  RETRY_FAILED_TRANSACTION,
  VOID_INVOICE,
} from "@/lib/graphql/billing";
import type { Invoice, Transaction } from "@/lib/graphql/types";

const INVOICE_TONES = {
  paid: "positive",
  open: "neutral",
  draft: "muted",
  void: "muted",
  uncollectible: "negative",
} as const;

const TRANSACTION_TONES = {
  succeeded: "positive",
  pending: "neutral",
  failed: "negative",
  canceled: "muted",
  refunded: "muted",
  partially_refunded: "warning",
} as const;

export function PaymentsTab({ userId }: { userId: string }) {
  const t = useTranslations("members.paymentsTab");
  const toast = useToast();

  const invoices = useQuery<{ listUserInvoices: { invoices: Invoice[] | null } }>(LIST_USER_INVOICES, {
    variables: { userId },
  });
  const transactions = useQuery<{ listUserTransactions: { transactions: Transaction[] | null } }>(
    LIST_USER_TRANSACTIONS,
    { variables: { userId, limit: 20 } },
  );

  const [voidInvoice] = useMutation(VOID_INVOICE, { onCompleted: () => invoices.refetch() });
  const [refund] = useMutation(REFUND_TRANSACTION, { onCompleted: () => transactions.refetch() });
  const [retry] = useMutation(RETRY_FAILED_TRANSACTION, { onCompleted: () => transactions.refetch() });

  const handleRefund = async (transaction: Transaction) => {
    const { data } = await refund({ variables: { input: { transactionId: transaction.id } } });
    if (data?.refundTransaction?.success) toast(t("refunded"));
    else toast(data?.refundTransaction?.message ?? t("refundFailed"), "error");
  };

  const invoiceList = invoices.data?.listUserInvoices?.invoices ?? [];
  const transactionList = transactions.data?.listUserTransactions?.transactions ?? [];

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>
          {t("invoices")}
        </Typography>
        {invoices.loading && !invoices.data ? (
          <Skeleton variant="rounded" height={80} />
        ) : (
          <List disablePadding>
            {invoiceList.map((invoice) => (
              <ListItem key={invoice.id} divider sx={{ px: 0, gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{invoice.invoiceNumber ?? invoice.id.slice(0, 8)}</Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    {formatDate(invoice.created_at)}
                    {invoice.isOverdue ? t("overdue") : ""}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {invoice.formattedTotal}
                </Typography>
                <StatusChip
                  tone={invoice.isOverdue ? "negative" : (INVOICE_TONES[invoice.status] ?? "neutral")}
                  label={invoice.status}
                />
                {invoice.status === "open" ? (
                  <Button size="small" variant="text" onClick={() => voidInvoice({ variables: { invoiceId: invoice.id } })}>
                    {t("void")}
                  </Button>
                ) : null}
              </ListItem>
            ))}
            {invoiceList.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 2 }}>
                {t("noInvoices")}
              </Typography>
            ) : null}
          </List>
        )}
      </Box>

      <Box>
        <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>
          {t("transactions")}
        </Typography>
        {transactions.loading && !transactions.data ? (
          <Skeleton variant="rounded" height={80} />
        ) : (
          <List disablePadding>
            {transactionList.map((transaction) => (
              <ListItem key={transaction.id} divider sx={{ px: 0, gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{transaction.description ?? transaction.type}</Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    {formatDateTime(transaction.created_at)}
                    {transaction.failureReason ? ` · ${transaction.failureReason}` : ""}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatCents(transaction.amount, transaction.currency)}
                </Typography>
                <StatusChip tone={TRANSACTION_TONES[transaction.status] ?? "neutral"} label={transaction.status} />
                {transaction.status === "succeeded" && transaction.amountRefunded === 0 ? (
                  <Button size="small" variant="text" onClick={() => handleRefund(transaction)}>
                    {t("refund")}
                  </Button>
                ) : null}
                {transaction.status === "failed" ? (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => retry({ variables: { transactionId: transaction.id } })}
                  >
                    {t("retry")}
                  </Button>
                ) : null}
              </ListItem>
            ))}
            {transactionList.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 2 }}>
                {t("noTransactions")}
              </Typography>
            ) : null}
          </List>
        )}
      </Box>
    </Stack>
  );
}
