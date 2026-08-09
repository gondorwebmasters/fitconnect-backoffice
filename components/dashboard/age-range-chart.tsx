"use client";

import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import { Chart, useChart } from "@/components/chart";
import type { AgeRangeCount } from "@/lib/graphql/reports";

export function AgeRangeChart({ data, loading }: { data: AgeRangeCount[]; loading?: boolean }) {
  const t = useTranslations("dashboard.ageRangeChart");

  const chartOptions = useChart({
    xaxis: { categories: data.map((item) => item.range) },
    tooltip: { y: { formatter: (value: number) => t("customers", { value }) } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "48%" } },
  });

  if (loading) {
    return <Skeleton variant="rounded" height={200} />;
  }

  if (data.length === 0 || data.every((item) => item.count === 0)) {
    return (
      <Typography variant="body2" sx={{ py: 8, textAlign: "center", color: "text.disabled" }}>
        {t("empty")}
      </Typography>
    );
  }

  return (
    <Chart
      type="bar"
      series={[{ name: "count", data: data.map((item) => item.count) }]}
      options={chartOptions}
      height={200}
    />
  );
}
