"use client";

import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";

import { Chart, useChart } from "@/components/chart";
import type { UserStats } from "@/lib/graphql/types";

export function UsersStatusChart({ users, loading }: { users?: UserStats; loading?: boolean }) {
  const t = useTranslations("dashboard.usersStatusChart");
  const theme = useTheme();

  const tones = [theme.palette.primary.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.grey[400]];

  const data = users
    ? [
        { key: t("new"), value: users.newUsers },
        { key: t("pending"), value: users.pendingUsers },
        { key: t("blocked"), value: users.blockedUsers },
        { key: t("inactive"), value: users.notActiveUsers },
      ]
    : [];

  const chartOptions = useChart({
    colors: tones,
    xaxis: { categories: data.map((item) => item.key) },
    tooltip: { y: { formatter: (value: number) => t("members", { value }) } },
    plotOptions: { bar: { distributed: true, borderRadius: 6, columnWidth: "56%" } },
  });

  if (loading || !users) {
    return <Skeleton variant="rounded" height={168} />;
  }

  if (data.every((item) => item.value === 0)) {
    return (
      <Typography variant="body2" sx={{ py: 7, textAlign: "center", color: "text.disabled" }}>
        {t("empty")}
      </Typography>
    );
  }

  return (
    <Chart type="bar" series={[{ data: data.map((item) => item.value) }]} options={chartOptions} height={168} />
  );
}
