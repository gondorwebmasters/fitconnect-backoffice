"use client";

import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { BadgeDot } from "@/components/ui/badge-dot";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { PageShell } from "@/components/ui/sticky-header";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { formatCents, formatDate, formatDateTime, fullName } from "@/lib/format";
import {
  GET_OVERDUE_INVOICES,
  LIST_USER_TRANSACTIONS,
  MARK_INVOICE_UNCOLLECTIBLE,
  REFUND_TRANSACTION,
  RETRY_FAILED_TRANSACTION,
  VOID_INVOICE,
} from "@/lib/graphql/billing";
import type { Invoice, Transaction, User } from "@/lib/graphql/types";
import { GET_USERS } from "@/lib/graphql/users";

const TRANSACTION_TONES: Record<string, "positive" | "neutral" | "warning" | "negative" | "muted"> = {
  succeeded: "positive",
  pending: "neutral",
  failed: "negative",
  canceled: "muted",
  refunded: "muted",
  partially_refunded: "warning",
};

const PAGE_SIZE = 10;

function OverdueInvoices() {
  const t = useTranslations("billing");
  const toast = useToast();
  const [page, setPage] = useState(0);
  const { data, loading, refetch } = useQuery<{ getOverdueInvoices: { invoices: Invoice[] | null } }>(
    GET_OVERDUE_INVOICES,
  );
  const [voidInvoice] = useMutation(VOID_INVOICE, { onCompleted: () => refetch() });
  const [markUncollectible] = useMutation(MARK_INVOICE_UNCOLLECTIBLE, { onCompleted: () => refetch() });

  const allInvoices = data?.getOverdueInvoices?.invoices ?? [];
  const pageCount = Math.max(Math.ceil(allInvoices.length / PAGE_SIZE), 1);
  const invoices = allInvoices.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const columns: Column<Invoice>[] = [
    {
      key: "number",
      header: t("columns.invoice"),
      render: (invoice) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {invoice.invoiceNumber ?? invoice.id.slice(0, 8)}
        </Typography>
      ),
    },
    {
      key: "member",
      header: t("columns.member"),
      render: (invoice) => <Typography variant="body2">{fullName(invoice.user)}</Typography>,
    },
    {
      key: "due",
      header: t("columns.dueDate"),
      render: (invoice) => (
        <Typography variant="body2" sx={{ color: "error.main" }}>
          {formatDate(invoice.dueDate)}
        </Typography>
      ),
    },
    {
      key: "total",
      header: t("columns.amount"),
      render: (invoice) => (
        <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {invoice.formattedTotal}
        </Typography>
      ),
    },
    {
      key: "remaining",
      header: t("columns.remaining"),
      render: (invoice) => (
        <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {formatCents(invoice.amountRemaining, invoice.currency)}
        </Typography>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (invoice) => (
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              voidInvoice({ variables: { invoiceId: invoice.id } }).then(() => toast(t("invoiceVoided")));
            }}
          >
            {t("void")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              markUncollectible({ variables: { invoiceId: invoice.id } }).then(() =>
                toast(t("markedUncollectible")),
              );
            }}
          >
            {t("uncollectible")}
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={invoices}
        rowKey={(invoice) => invoice.id}
        loading={loading}
        emptyMessage={t("noOverdueInvoices")}
      />
      <Pagination page={page} pageCount={pageCount} onChange={setPage} totalLabel={t("invoiceTotalLabel", { count: allInvoices.length })} />
    </>
  );
}

function UserTransactions() {
  const t = useTranslations("billing");
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const users = useQuery<{ getUsers: { users: User[] | null } }>(GET_USERS, {
    variables: { query },
    skip: query.length < 2,
  });

  const [loadTransactions, transactions] = useLazyQuery<{
    listUserTransactions: { transactions: Transaction[] | null };
  }>(LIST_USER_TRANSACTIONS);

  const [refund] = useMutation(REFUND_TRANSACTION);
  const [retry] = useMutation(RETRY_FAILED_TRANSACTION);

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setSearch("");
    setQuery("");
    setPage(0);
    loadTransactions({ variables: { userId: user.id, limit: 50 } });
  };

  const allRows = transactions.data?.listUserTransactions?.transactions ?? [];
  const pageCount = Math.max(Math.ceil(allRows.length / PAGE_SIZE), 1);
  const rows = allRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const columns: Column<Transaction>[] = [
    {
      key: "date",
      header: t("columns.date"),
      render: (transaction) => <Typography variant="body2">{formatDateTime(transaction.created_at)}</Typography>,
    },
    {
      key: "concept",
      header: t("columns.concept"),
      render: (transaction) => (
        <Box>
          <Typography variant="body2">{transaction.description ?? transaction.type}</Typography>
          {transaction.failureReason ? (
            <Typography variant="caption" sx={{ color: "error.main" }}>
              {transaction.failureReason}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      key: "amount",
      header: t("columns.amount"),
      render: (transaction) => (
        <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {formatCents(transaction.amount, transaction.currency)}
        </Typography>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (transaction) => (
        <BadgeDot tone={TRANSACTION_TONES[transaction.status] ?? "neutral"} label={transaction.status} />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (transaction) => (
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          {transaction.status === "succeeded" && transaction.amountRefunded === 0 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                const { data } = await refund({ variables: { input: { transactionId: transaction.id } } });
                if (data?.refundTransaction?.success) toast(t("refundIssued"));
                else toast(data?.refundTransaction?.message ?? t("refundFailed"), "error");
                transactions.refetch?.();
              }}
            >
              {t("refund")}
            </Button>
          ) : null}
          {transaction.status === "failed" ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await retry({ variables: { transactionId: transaction.id } });
                transactions.refetch?.();
              }}
            >
              {t("retry")}
            </Button>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={2}>
      <Autocomplete
        size="small"
        sx={{ width: 384 }}
        options={users.data?.getUsers?.users ?? []}
        filterOptions={(options) => options}
        inputValue={search}
        onInputChange={(_event, value) => setSearch(value)}
        onChange={(_event, user) => user && selectUser(user)}
        getOptionLabel={(user) => fullName(user)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={t("searchMemberHint")}
        renderOption={(props, user) => (
          <li {...props} key={user.id}>
            <Stack direction="row" justifyContent="space-between" sx={{ width: 1 }}>
              <span>{fullName(user)}</span>
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                {user.email}
              </Typography>
            </Stack>
          </li>
        )}
        renderInput={(params) => <TextField {...params} placeholder={t("searchMemberPlaceholder")} />}
      />

      {selectedUser ? (
        <>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("transactionsOf")}{" "}
            <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
              {fullName(selectedUser)}
            </Typography>
          </Typography>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(transaction) => transaction.id}
            loading={transactions.loading}
            emptyMessage={t("noTransactions")}
          />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} totalLabel={t("transactionTotalLabel", { count: allRows.length })} />
        </>
      ) : (
        <Box sx={{ borderRadius: 2, border: 1, borderStyle: "dashed", borderColor: "divider", py: 8, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.disabled" }}>
            {t("searchMemberHint")}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

export default function BillingPage() {
  const t = useTranslations("billing");
  const [tab, setTab] = useState("invoices");

  return (
    <PageShell
      header={
        <>
          <PageHeader title={t("title")} subtitle={t("subtitle")} />
          <Box sx={{ mb: 3 }}>
            <Tabs
              items={[
                { value: "invoices", label: t("overdueInvoicesTab") },
                { value: "transactions", label: t("transactionsTab") },
              ]}
              value={tab}
              onChange={setTab}
            />
          </Box>
        </>
      }
    >
      {tab === "invoices" ? <OverdueInvoices /> : <UserTransactions />}
    </PageShell>
  );
}
