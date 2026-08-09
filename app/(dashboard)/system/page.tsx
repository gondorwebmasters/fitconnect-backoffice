"use client";

import { useQuery } from "@apollo/client";
import Grid from "@mui/material/Grid";
import { useTranslations } from "next-intl";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/sticky-header";
import { GET_GLOBAL_SYSTEM_STATS } from "@/lib/graphql/stats";

type GlobalStats = {
  getGlobalSystemStats: {
    success: boolean;
    totalUsers: number | null;
    totalCompanies: number | null;
  } | null;
};

export default function SystemPage() {
  const t = useTranslations("system.page");
  const { data, loading } = useQuery<GlobalStats>(GET_GLOBAL_SYSTEM_STATS);
  const stats = data?.getGlobalSystemStats;

  return (
    <PageShell header={<PageHeader title={t("title")} subtitle={t("subtitle")} />}>
      <Grid container spacing={2} sx={{ maxWidth: 512 }}>
        <Grid size={6}>
          <KpiCard
            label={t("totalUsers")}
            value={stats?.totalUsers ?? "—"}
            detail={t("totalUsersDetail")}
            loading={loading && !stats}
          />
        </Grid>
        <Grid size={6}>
          <KpiCard
            label={t("companies")}
            value={stats?.totalCompanies ?? "—"}
            detail={t("companiesDetail")}
            loading={loading && !stats}
          />
        </Grid>
      </Grid>
    </PageShell>
  );
}
