"use client";

import { useLazyQuery, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { MemberPanel } from "@/components/members/member-panel";
import { BadgeDot } from "@/components/ui/badge-dot";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/sticky-header";
import { Dropdown } from "@/components/ui/dropdown";
import { formatCents, formatDate, fullName, planPriceCents } from "@/lib/format";
import { GET_PLAN_WITH_SUBSCRIPTIONS, LIST_PLANS } from "@/lib/graphql/plans";
import { GET_SUBSCRIPTIONS_STATS } from "@/lib/graphql/stats";
import type { Plan, Subscription, SubscriptionsStat, User } from "@/lib/graphql/types";
import { FIND_USER } from "@/lib/graphql/users";

const STATUS_TONES: Record<string, "positive" | "neutral" | "warning" | "negative" | "muted"> = {
  active: "positive",
  trialing: "neutral",
  past_due: "warning",
  paused: "muted",
  canceled: "muted",
  unpaid: "negative",
  incomplete: "warning",
  incomplete_expired: "muted",
};

const STATUS_FILTER_VALUES = ["active", "", "trialing", "past_due", "unpaid", "paused", "canceled"] as const;

const PAGE_SIZE = 10;

export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions");
  const statusLabels = useTranslations("subscriptions.statusLabels");

  // La tarjeta de resumen ("stats") solo cuenta suscripciones activas — si la
  // tabla mostrase todos los estados por defecto (incl. canceladas/expiradas),
  // el número de la tarjeta y el de la lista no coincidirían nunca. "Activas"
  // como filtro inicial es lo que hace que ambos números cuadren; el resto de
  // estados sigue disponible para auditar el histórico.
  const STATUS_FILTERS = STATUS_FILTER_VALUES.map((value) => ({
    value,
    label: t(`statusFilters.${value || "all"}`),
  }));

  const [planId, setPlanId] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(0);
  const [member, setMember] = useState<User | null>(null);

  const stats = useQuery<{ getSubscriptionsStats: { stats: SubscriptionsStat[] } }>(GET_SUBSCRIPTIONS_STATS);
  const plans = useQuery<{ listPlans: { plans: Plan[] | null } }>(LIST_PLANS);
  const planDetail = useQuery<{ getPlan: { plan: Plan | null } }>(GET_PLAN_WITH_SUBSCRIPTIONS, {
    variables: { planId },
    skip: !planId,
  });
  const [findUser] = useLazyQuery<{ findUser: { user: User | null } }>(FIND_USER);

  const allSubscriptions = planDetail.data?.getPlan?.plan?.subscriptions ?? [];
  const filteredSubscriptions = useMemo(
    () => (statusFilter ? allSubscriptions.filter((sub) => sub.status === statusFilter) : allSubscriptions),
    [allSubscriptions, statusFilter],
  );
  const pageCount = Math.max(Math.ceil(filteredSubscriptions.length / PAGE_SIZE), 1);
  const subscriptions = filteredSubscriptions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalByPlan = stats.data?.getSubscriptionsStats?.stats ?? [];

  const selectPlan = (id: string) => {
    setPlanId(id);
    setStatusFilter("active");
    setPage(0);
  };

  const openMember = async (subscription: Subscription) => {
    if (!subscription.user?.id) return;
    const { data } = await findUser({ variables: { id: subscription.user.id } });
    if (data?.findUser?.user) setMember(data.findUser.user);
  };

  const columns: Column<Subscription>[] = [
    {
      key: "user",
      header: t("columns.member"),
      render: (subscription) => <Typography variant="body2">{subscription.user ? fullName(subscription.user) : "—"}</Typography>,
    },
    {
      key: "since",
      header: t("columns.since"),
      render: (subscription) => (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatDate(subscription.created_at)}
        </Typography>
      ),
    },
    {
      key: "periodEnd",
      header: t("columns.periodEnd"),
      render: (subscription) => (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatDate(subscription.currentPeriodEnd)}
        </Typography>
      ),
    },
    {
      key: "nextBilling",
      header: t("columns.nextBilling"),
      render: (subscription) => (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatDate(subscription.nextBillingDate)}
        </Typography>
      ),
    },
    {
      key: "failed",
      header: t("columns.failedPayments"),
      render: (subscription) => (
        <Typography variant="body2" sx={{ color: subscription.failedPaymentAttempts > 0 ? "error.main" : "text.disabled" }}>
          {subscription.failedPaymentAttempts}
        </Typography>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (subscription) => {
        const tone = STATUS_TONES[subscription.status] ?? "neutral";
        const label = ["active", "trialing", "past_due", "paused", "canceled", "unpaid", "incomplete", "incomplete_expired"].includes(
          subscription.status,
        )
          ? statusLabels(subscription.status as Parameters<typeof statusLabels>[0])
          : subscription.status;
        return <BadgeDot tone={tone} label={label} />;
      },
    },
  ];

  return (
    <>
      <PageShell
        header={
          <>
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {totalByPlan.map((stat) => (
                <Grid key={stat.planId} size={{ xs: 6, lg: 3 }}>
                  <Card
                    variant="outlined"
                    onClick={() => selectPlan(stat.planId)}
                    sx={{
                      p: 2.5,
                      cursor: "pointer",
                      borderColor: planId === stat.planId ? "primary.main" : "divider",
                      transition: (theme) => theme.transitions.create(["border-color", "box-shadow"]),
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }} noWrap>
                      {stat.planName}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 0.5 }}>
                      {stat.count}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.disabled" }}>
                      {t("activeSubscriptions")}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Stack direction="row" flexWrap="wrap" spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ width: 288 }}>
                <Dropdown
                  options={(plans.data?.listPlans?.plans ?? []).map((plan) => ({
                    value: plan.id,
                    label: `${plan.name} · ${formatCents(planPriceCents(plan), plan.currency)}`,
                  }))}
                  placeholder={t("selectPlanPlaceholder")}
                  value={planId}
                  onChange={selectPlan}
                  searchable
                  size="small"
                />
              </Box>
              {planId ? (
                <Box sx={{ width: 192 }}>
                  <Dropdown
                    options={STATUS_FILTERS}
                    value={statusFilter}
                    onChange={(value) => {
                      setStatusFilter(value);
                      setPage(0);
                    }}
                    size="small"
                  />
                </Box>
              ) : null}
            </Stack>
          </>
        }
      >
        {planId ? (
          <>
            <DataTable
              columns={columns}
              rows={subscriptions}
              rowKey={(subscription) => subscription.id}
              onRowClick={openMember}
              loading={planDetail.loading}
              emptyMessage={t("emptyTable")}
            />
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={setPage}
              totalLabel={t("totalLabel", { count: filteredSubscriptions.length })}
            />
          </>
        ) : (
          <Box sx={{ borderRadius: 2, border: 1, borderStyle: "dashed", borderColor: "divider", py: 8, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              {t("selectPlanHint")}
            </Typography>
          </Box>
        )}
      </PageShell>

      <MemberPanel member={member} onClose={() => setMember(null)} onChanged={() => planDetail.refetch()} />
    </>
  );
}