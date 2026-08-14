"use client";

import { useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import MuiCard from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { ActivityOverviewChart } from "@/components/dashboard/activity-overview-chart";
import { AgeRangeChart } from "@/components/dashboard/age-range-chart";
import { AttentionList } from "@/components/dashboard/attention-list";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OccupancyHeatmap } from "@/components/dashboard/occupancy-heatmap";
import { PlanDistributionChart } from "@/components/dashboard/plan-distribution-chart";
import { PromotionsByMonthChart } from "@/components/dashboard/promotions-by-month-chart";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { SignupsChurnChart } from "@/components/dashboard/signups-churn-chart";
import { UsersStatusChart } from "@/components/dashboard/users-status-chart";
import { useSession } from "@/components/layout/session-provider";
import { Dropdown } from "@/components/ui/dropdown";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { PageShell } from "@/components/ui/sticky-header";
import { GET_OVERDUE_INVOICES } from "@/lib/graphql/billing";
import { GET_REPORT_METRICS, type ReportMetricsData } from "@/lib/graphql/reports";
import {
  GET_ADMIN_STATS,
  GET_SCHEDULES_STATS,
  GET_SUBSCRIPTIONS_STATS,
} from "@/lib/graphql/stats";
import type { AdminStats, Invoice, SchedulesStat, SubscriptionsStat } from "@/lib/graphql/types";

function formatEuros(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

/** Ocupación media (%) de un mes a partir de los ratios por franja. */
function averageRatio(stats: SchedulesStat[] | undefined): number | null {
  if (!stats || stats.length === 0) return null;
  return stats.reduce((sum, stat) => sum + stat.ratio, 0) / stats.length;
}

/** Variación (%) entre los dos últimos puntos de una serie mensual cronológica. */
function lastMonthDelta(series: { count: number }[] | undefined): number | undefined {
  if (!series || series.length < 2) return undefined;
  const previous = series[series.length - 2].count;
  const current = series[series.length - 1].count;
  if (previous <= 0) return undefined;
  return ((current - previous) / previous) * 100;
}

function Card({
  title,
  children,
  actions,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  delay?: number;
}) {
  return (
    <MuiCard
      component={motion.section}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      variant="outlined"
      sx={{ p: 3 }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2">{title}</Typography>
        {actions}
      </Stack>
      {children}
    </MuiCard>
  );
}

const INTL_LOCALE: Record<string, string> = { es: "es-ES", pt: "pt-PT" };

export default function DashboardPage() {
  const { user } = useSession();
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale] ?? locale;
  const MONTHS = Array.from({ length: 12 }, (_, index) => t(`months.${index}`));
  const [month, setMonth] = useState(new Date().getMonth());

  const adminStats = useQuery<{ getAdminStats: { stats: AdminStats | null } }>(GET_ADMIN_STATS);
  // stats[0] = mes solicitado, stats[1] = mes anterior (ver schedule.service.ts)
  const schedulesStats = useQuery<{ getSchedulesStats: { stats: SchedulesStat[][] } }>(GET_SCHEDULES_STATS, {
    variables: { month },
  });
  const subscriptionsStats = useQuery<{ getSubscriptionsStats: { stats: SubscriptionsStat[] } }>(
    GET_SUBSCRIPTIONS_STATS,
  );
  const overdue = useQuery<{ getOverdueInvoices: { invoices: Invoice[] | null } }>(GET_OVERDUE_INVOICES);
  const reportMetrics = useQuery<{ getReportMetrics: { metrics: ReportMetricsData | null } }>(GET_REPORT_METRICS);

  const stats = adminStats.data?.getAdminStats?.stats;
  const report = reportMetrics.data?.getReportMetrics?.metrics;

  // stats[0] = mes seleccionado, stats[1] = mes anterior → ocupación media y variación
  const monthlyStats = schedulesStats.data?.getSchedulesStats?.stats;
  const currentOccupancy = averageRatio(monthlyStats?.[0]);
  const previousOccupancy = averageRatio(monthlyStats?.[1]);
  const occupancyDelta =
    currentOccupancy !== null && previousOccupancy !== null && previousOccupancy > 0
      ? ((currentOccupancy - previousOccupancy) / previousOccupancy) * 100
      : undefined;

  return (
    <PageShell
      header={
        <PageHeader
          title={t("greeting", { name: user?.name ? `, ${user.name}` : "" })}
          subtitle={t("subtitle")}
        />
      }
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2 }}>
        <StatCard
          index={0}
          label={t("kpi.members")}
          value={stats?.users.totalUsers ?? "—"}
          delta={lastMonthDelta(report?.newUsersByMonth)}
          deltaLabel={
            stats
              ? t("kpi.membersDetail", { newUsers: stats.users.newUsers, pendingUsers: stats.users.pendingUsers })
              : undefined
          }
          trend={report?.newUsersByMonth.map((entry) => entry.count)}
          trendColor="success"
          loading={adminStats.loading && !stats}
        />
        <StatCard
          index={1}
          label={t("kpi.subscriptions")}
          value={stats?.subscriptions ?? "—"}
          delta={lastMonthDelta(report?.subscriptionsByMonth)}
          deltaLabel={stats ? t("kpi.subscriptionsDetail", { plans: stats.plans }) : undefined}
          trend={report?.subscriptionsByMonth.map((entry) => entry.count)}
          trendColor="info"
          loading={adminStats.loading && !stats}
        />
        <StatCard
          index={2}
          label={t("kpi.classes")}
          value={stats?.schedules ?? "—"}
          delta={lastMonthDelta(report?.schedulesByMonth)}
          deltaLabel={t("kpi.classesDetail")}
          trend={report?.schedulesByMonth.map((entry) => entry.count)}
          trendColor="primary"
          loading={adminStats.loading && !stats}
        />
        <StatCard
          index={3}
          label={t("kpi.transactions")}
          value={stats?.transactions ?? "—"}
          delta={lastMonthDelta(report?.transactionsByMonth)}
          deltaLabel={t("kpi.transactionsDetail")}
          trend={report?.transactionsByMonth.map((entry) => entry.count)}
          trendColor="warning"
          loading={adminStats.loading && !stats}
        />
        <StatCard
          index={4}
          label={t("kpi.occupancy")}
          value={currentOccupancy !== null ? `${Math.round(currentOccupancy)}%` : "—"}
          delta={occupancyDelta}
          deltaLabel={`${t("kpi.occupancyDeltaLabel")} · ${t("kpi.occupancyDetail", { month: MONTHS[month].toLowerCase() })}`}
          trend={monthlyStats?.[0]?.map((stat) => Math.round(stat.ratio))}
          trendColor="info"
          loading={schedulesStats.loading && !monthlyStats}
        />
      </Box>

      <Box sx={{ mt: 3, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "repeat(5, 1fr)" } }}>
        <Box sx={{ gridColumn: { lg: "span 3" } }}>
          <Card
            title={t("cards.occupancyByTimeSlot")}
            delay={0.15}
            actions={
              <Dropdown
                options={MONTHS.map((name, index) => ({ value: String(index), label: name }))}
                value={String(month)}
                onChange={(value) => setMonth(Number(value))}
                size="small"
                sx={{ width: 144 }}
              />
            }
          >
            <OccupancyHeatmap
              stats={schedulesStats.data?.getSchedulesStats?.stats?.[0] ?? []}
              loading={schedulesStats.loading && !schedulesStats.data}
            />
          </Card>
        </Box>
        <Box sx={{ gridColumn: { lg: "span 2" } }}>
          <Card title={t("cards.membersByPlan")} delay={0.2}>
            <PlanDistributionChart
              stats={subscriptionsStats.data?.getSubscriptionsStats?.stats ?? []}
              loading={subscriptionsStats.loading && !subscriptionsStats.data}
            />
          </Card>
        </Box>
      </Box>

      <Box sx={{ mt: 3, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "repeat(5, 1fr)" } }}>
        <Box sx={{ gridColumn: { lg: "span 2" } }}>
          <Card title={t("cards.membersStatus")} delay={0.25}>
            <UsersStatusChart users={stats?.users} loading={adminStats.loading && !stats} />
          </Card>
        </Box>
        <Box sx={{ gridColumn: { lg: "span 3" } }}>
          <Card title={t("cards.generalActivity")} delay={0.3}>
            <ActivityOverviewChart stats={stats} loading={adminStats.loading && !stats} />
          </Card>
        </Box>
      </Box>

      <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
        <StatCard
          index={0}
          label={t("kpi.totalRevenue")}
          value={report ? formatEuros(report.totalRevenue, intlLocale) : "—"}
          detail={t("kpi.totalRevenueDetail")}
          trend={report?.revenueByMonth.map((entry) => entry.amount)}
          trendColor="success"
          loading={reportMetrics.loading && !report}
        />
        <KpiCard
          index={1}
          label={t("kpi.productsSold")}
          value={report?.productsSold ?? "—"}
          loading={reportMetrics.loading && !report}
        />
        <StatCard
          index={2}
          label={t("kpi.promotionsApplied")}
          value={report?.promotionsApplied ?? "—"}
          delta={lastMonthDelta(report?.promotionsAppliedByMonth)}
          trend={report?.promotionsAppliedByMonth.map((entry) => entry.count)}
          trendColor="warning"
          loading={reportMetrics.loading && !report}
        />
      </Box>

      <Box sx={{ mt: 3, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" } }}>
        <Card title={t("cards.signupsChurn")} delay={0.3}>
          <SignupsChurnChart
            newByMonth={report?.newUsersByMonth ?? []}
            churnedByMonth={report?.churnedUsersByMonth ?? []}
            loading={reportMetrics.loading && !report}
          />
        </Card>
        <Card title={t("cards.ageRange")} delay={0.35}>
          <AgeRangeChart data={report?.usersByAgeRange ?? []} loading={reportMetrics.loading && !report} />
        </Card>
      </Box>

      <Box sx={{ mt: 3, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" } }}>
        <Card title={t("cards.revenueTrend")} delay={0.3}>
          <RevenueTrendChart data={report?.revenueByMonth ?? []} loading={reportMetrics.loading && !report} />
        </Card>
        <Card title={t("cards.promotionsByMonth")} delay={0.35}>
          <PromotionsByMonthChart
            data={report?.promotionsAppliedByMonth ?? []}
            loading={reportMetrics.loading && !report}
          />
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Card title={t("cards.needsAttention")} delay={0.35}>
          <AttentionList
            overdueInvoices={overdue.data?.getOverdueInvoices?.invoices ?? []}
            pendingUsers={stats?.users.pendingUsers ?? 0}
            loading={overdue.loading && !overdue.data}
          />
        </Card>
      </Box>
    </PageShell>
  );
}
