"use client";

import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useLocale, useTranslations } from "next-intl";

import { Chart, useChart } from "@/components/chart";
import type { MonthAmount } from "@/lib/graphql/reports";

const INTL_LOCALE: Record<string, string> = { es: "es-ES", pt: "pt-PT" };

function formatEuros(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

export function RevenueTrendChart({ data, loading }: { data: MonthAmount[]; loading?: boolean }) {
  const t = useTranslations("dashboard.revenueTrendChart");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale] ?? locale;

  const chartOptions = useChart({
    chart: { type: "area" },
    xaxis: { categories: data.map((item) => item.month) },
    tooltip: { y: { formatter: (value: number) => formatEuros(value, intlLocale) } },
    stroke: { width: 2, curve: "smooth" },
  });

  if (loading) {
    return <Skeleton variant="rounded" height={220} />;
  }

  if (data.length === 0) {
    return (
      <Typography variant="body2" sx={{ py: 8, textAlign: "center", color: "text.disabled" }}>
        {t("empty")}
      </Typography>
    );
  }

  return (
    <Chart type="area" series={[{ data: data.map((item) => item.amount) }]} options={chartOptions} height={220} />
  );
}
