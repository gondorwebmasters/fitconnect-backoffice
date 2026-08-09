"use client";

import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import { Chart, useChart } from "@/components/chart";
import type { MonthCount } from "@/lib/graphql/reports";

export function PromotionsByMonthChart({ data, loading }: { data: MonthCount[]; loading?: boolean }) {
  const t = useTranslations("dashboard.promotionsByMonthChart");

  const chartOptions = useChart({
    xaxis: { categories: data.map((item) => item.month) },
    tooltip: { y: { formatter: (value: number) => t("promotions", { value }) } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "40%" } },
  });

  if (loading) {
    return <Skeleton variant="rounded" height={200} />;
  }

  if (data.length === 0) {
    return (
      <Typography variant="body2" sx={{ py: 8, textAlign: "center", color: "text.disabled" }}>
        {t("empty")}
      </Typography>
    );
  }

  return (
    <Chart type="bar" series={[{ data: data.map((item) => item.count) }]} options={chartOptions} height={200} />
  );
}
