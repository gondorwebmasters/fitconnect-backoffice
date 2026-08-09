"use client";
import { Iconify } from "@/components/iconify";

import { useMutation, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PlanForm } from "@/components/plans/plan-form";
import { BadgeDot } from "@/components/ui/badge-dot";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { PageShell } from "@/components/ui/sticky-header";
import { useToast } from "@/components/ui/toast";
import { formatCents, planPriceCents } from "@/lib/format";
import { ARCHIVE_PLAN, LIST_PLANS } from "@/lib/graphql/plans";
import type { Plan } from "@/lib/graphql/types";

const PAGE_SIZE = 10;

export default function PlansPage() {
  const t = useTranslations("plans");
  const toast = useToast();

  const INTERVAL_LABELS: Record<string, string> = {
    day: t("intervals.day"),
    week: t("intervals.week"),
    month: t("intervals.month"),
    year: t("intervals.year"),
  };
  const [editing, setEditing] = useState<Plan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [archiving, setArchiving] = useState<Plan | null>(null);
  const [page, setPage] = useState(0);

  const { data, loading, refetch } = useQuery<{ listPlans: { plans: Plan[] | null } }>(LIST_PLANS);
  const [archivePlan, archiveState] = useMutation(ARCHIVE_PLAN);

  const allPlans = data?.listPlans?.plans ?? [];
  const pageCount = Math.max(Math.ceil(allPlans.length / PAGE_SIZE), 1);
  const plans = allPlans.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleArchive = async () => {
    if (!archiving) return;
    const { data: result } = await archivePlan({ variables: { planId: archiving.id } });
    if (result?.archivePlan?.success) {
      toast(t("archived"));
      refetch();
    } else {
      toast(result?.archivePlan?.message ?? t("archiveFailed"), "error");
    }
    setArchiving(null);
  };

  const columns: Column<Plan>[] = [
    {
      key: "name",
      header: t("columns.plan"),
      render: (plan) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {plan.name}
          </Typography>
          {plan.description ? (
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", maxWidth: 320 }} noWrap>
              {plan.description}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      key: "price",
      header: t("columns.price"),
      render: (plan) => (
        <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {formatCents(planPriceCents(plan), plan.currency)}
          <Typography component="span" variant="body2" sx={{ color: "text.disabled" }}>
            {" "}
            / {INTERVAL_LABELS[plan.interval] ?? plan.interval}
          </Typography>
        </Typography>
      ),
    },
    {
      key: "trial",
      header: t("columns.trial"),
      render: (plan) => (
        <Typography variant="body2">{plan.trialPeriodDays ? t("trialDays", { count: plan.trialPeriodDays }) : "—"}</Typography>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (plan) => (
        <BadgeDot
          tone={plan.status === "active" ? "positive" : plan.status === "archived" ? "muted" : "neutral"}
          label={plan.status === "active" ? t("statusLabels.active") : plan.status === "archived" ? t("statusLabels.archived") : t("statusLabels.inactive")}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      render: (plan) =>
        plan.status !== "archived" ? (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setArchiving(plan);
            }}
            title={t("archivePlan")}
            sx={{ color: "text.disabled" }}
          >
            <Iconify icon="solar:archive-bold" width={15} />
          </IconButton>
        ) : null,
    },
  ];

  return (
    <>
      <PageShell
        header={
          <PageHeader
            title={t("title")}
            subtitle={t("subtitle")}
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Iconify icon="mingcute:add-line" width={15} />
                {t("newPlan")}
              </Button>
            }
          />
        }
      >
        <DataTable
          columns={columns}
          rows={plans}
          rowKey={(plan) => plan.id}
          onRowClick={(plan) => {
            setEditing(plan);
            setFormOpen(true);
          }}
          loading={loading}
          emptyMessage={t("emptyTable")}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalLabel={t("totalLabel", { count: allPlans.length })} />
      </PageShell>

      <PlanForm open={formOpen} plan={editing} onClose={() => setFormOpen(false)} onSaved={() => refetch()} />

      <ConfirmDialog
        open={Boolean(archiving)}
        title={t("archivePlan")}
        description={t("archiveConfirmDescription", { name: archiving?.name ?? "" })}
        confirmLabel={t("archive")}
        loading={archiveState.loading}
        onConfirm={handleArchive}
        onCancel={() => setArchiving(null)}
      />
    </>
  );
}
