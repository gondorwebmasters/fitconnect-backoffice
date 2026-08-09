"use client";

import Skeleton from "@mui/material/Skeleton";
import { useTranslations } from "next-intl";

import { Chart, useChart } from "@/components/chart";
import type { AdminStats } from "@/lib/graphql/types";

export function ActivityOverviewChart({ stats, loading }: { stats?: AdminStats | null; loading?: boolean }) {
  const t = useTranslations("dashboard.activityChart");

  const categories = [t("classes"), t("polls"), t("plans"), t("subscriptions"), t("transactions"), t("notifications")];
  const values = stats
    ? [stats.schedules, stats.polls, stats.plans, stats.subscriptions, stats.transactions, stats.notifications]
    : [];

  const chartOptions = useChart({
    xaxis: { categories },
    yaxis: { labels: { formatter: (value: number) => String(Math.round(value)) } },
    tooltip: { y: { formatter: (value: number) => String(value) } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "48%" } },
  });

  if (loading || !stats) {
    return <Skeleton variant="rounded" height={220} />;
  }

  return (
    <Chart type="bar" series={[{ name: t("classes"), data: values }]} options={chartOptions} height={220} />
  );
}
