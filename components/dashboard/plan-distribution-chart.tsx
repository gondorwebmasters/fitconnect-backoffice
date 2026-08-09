"use client";

import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import { Chart, useChart } from "@/components/chart";
import type { SubscriptionsStat } from "@/lib/graphql/types";

export function PlanDistributionChart({ stats, loading }: { stats: SubscriptionsStat[]; loading?: boolean }) {
  const t = useTranslations("dashboard.planDistributionChart");

  const sorted = [...stats].sort((a, b) => b.count - a.count);
  const height = Math.max(sorted.length * 44, 120);

  const chartOptions = useChart({
    xaxis: { categories: sorted.map((stat) => stat.planName) },
    tooltip: { y: { formatter: (value: number) => t("subscriptions", { value }) } },
    plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "60%" } },
  });

  if (loading) {
    return <Skeleton variant="rounded" height={192} />;
  }

  if (stats.length === 0) {
    return (
      <Typography variant="body2" sx={{ py: 8, textAlign: "center", color: "text.disabled" }}>
        {t("empty")}
      </Typography>
    );
  }

  return (
    <Chart
      type="bar"
      series={[{ data: sorted.map((stat) => stat.count) }]}
      options={chartOptions}
      height={height}
    />
  );
}
