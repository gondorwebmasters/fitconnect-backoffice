"use client";

import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";

import { Chart, useChart } from "@/components/chart";
import type { MonthCount } from "@/lib/graphql/reports";

interface SignupsChurnChartProps {
  newByMonth: MonthCount[];
  churnedByMonth: MonthCount[];
  loading?: boolean;
}

export function SignupsChurnChart({ newByMonth, churnedByMonth, loading }: SignupsChurnChartProps) {
  const t = useTranslations("dashboard.signupsChurnChart");
  const theme = useTheme();

  const months = Array.from(new Set([...newByMonth, ...churnedByMonth].map((item) => item.month))).sort();

  const churnedMap = new Map(churnedByMonth.map((item) => [item.month, item.count]));
  const newMap = new Map(newByMonth.map((item) => [item.month, item.count]));

  const chartOptions = useChart({
    colors: [theme.palette.primary.main, theme.palette.grey[400]],
    xaxis: { categories: months },
    plotOptions: { bar: { borderRadius: 5, columnWidth: "44%" } },
    legend: { show: true },
  });

  if (loading) {
    return <Skeleton variant="rounded" height={220} />;
  }

  if (months.length === 0) {
    return (
      <Typography variant="body2" sx={{ py: 8, textAlign: "center", color: "text.disabled" }}>
        {t("empty")}
      </Typography>
    );
  }

  return (
    <Chart
      type="bar"
      series={[
        { name: t("signups"), data: months.map((month) => newMap.get(month) ?? 0) },
        { name: t("churn"), data: months.map((month) => churnedMap.get(month) ?? 0) },
      ]}
      options={chartOptions}
      height={220}
    />
  );
}
