"use client";
import { Iconify } from "@/components/iconify";

import { useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { GET_ACTIVE_COMPANY_LOGO, GET_ACTIVE_COMPANY_NAME } from "@/lib/graphql/companies";
import { GET_REPORT_METRICS, type ReportMetricsData } from "@/lib/graphql/reports";
import { fullName } from "@/lib/format";
import { ACCENT_HEX } from "@/theme/accents";
import { useSettingsContext } from "@/theme/settings";

import { useSession } from "@/components/layout/session-provider";

import { ALL_METRIC_IDS, type MetricId, type ReportLabels } from "./metrics-catalog";
import { MetricSelector } from "./metric-selector";
import { ReportDocument } from "./report-document";
import { ReportLightbox } from "./report-lightbox";
import { ReportPreviewHtml } from "./report-preview-html";

const INTL_LOCALE: Record<string, string> = { es: "es-ES", pt: "pt-PT" };

const EMPTY_METRICS: ReportMetricsData = {
  totalUsers: 0,
  churnedUsers: 0,
  newUsersByMonth: [],
  churnedUsersByMonth: [],
  usersByAgeRange: [],
  totalRevenue: 0,
  revenueByMonth: [],
  productsSold: 0,
  promotionsApplied: 0,
  promotionsAppliedByMonth: [],
};

export function ReportsView() {
  const t = useTranslations("reports.view");
  const td = useTranslations("reports.document");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale] ?? locale;
  const { user, companies } = useSession();
  const { primaryColor } = useSettingsContext();
  const accentHex = ACCENT_HEX[primaryColor].main;
  const { data, loading } = useQuery<{ getReportMetrics: { success: boolean; metrics: ReportMetricsData | null } }>(
    GET_REPORT_METRICS,
  );

  const [selected, setSelected] = useState<Set<MetricId>>(new Set(ALL_METRIC_IDS));
  const [debounced, setDebounced] = useState<Set<MetricId>>(selected);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(selected), 300);
    return () => clearTimeout(timeout);
  }, [selected]);

  const metrics = data?.getReportMetrics?.metrics ?? EMPTY_METRICS;
  const activeInSession = companies.some((company) => company.id === user?.activeCompanyId);
  const { data: activeCompanyData } = useQuery<{
    getCompanies: { company: { id: string; name: string } | null } | null;
  }>(GET_ACTIVE_COMPANY_NAME, {
    variables: { companyId: user?.activeCompanyId },
    skip: !user?.activeCompanyId || activeInSession,
  });
  const activeCompany =
    companies.find((company) => company.id === user?.activeCompanyId) ??
    activeCompanyData?.getCompanies?.company ??
    undefined;
  const gymName = activeCompany?.name ?? "FitConnect";
  const owner = fullName(user);
  const selectedMetrics = Array.from(debounced);

  const { data: logoData } = useQuery<{
    getCompanies: { company: { id: string; logo?: { url: string } | null } | null } | null;
  }>(GET_ACTIVE_COMPANY_LOGO, {
    variables: { companyId: user?.activeCompanyId },
    skip: !user?.activeCompanyId,
  });
  const rawLogoUrl = logoData?.getCompanies?.company?.logo?.url;
  const logoUrl = rawLogoUrl
    ? `/api/reports/logo?src=${encodeURIComponent(rawLogoUrl)}&color=${encodeURIComponent(accentHex)}`
    : undefined;

  const generatedAt = new Date();
  const dateLabel = new Intl.DateTimeFormat(intlLocale, { dateStyle: "long" }).format(generatedAt);
  const labels: ReportLabels = {
    kpis: {
      totalUsers: td("kpis.totalUsers"),
      churnedUsers: td("kpis.churnedUsers"),
      totalRevenue: td("kpis.totalRevenue"),
      productsSold: td("kpis.productsSold"),
      promotionsApplied: td("kpis.promotionsApplied"),
    },
    sections: {
      newUsersByMonth: td("sections.newUsersByMonth"),
      churnedUsersByMonth: td("sections.churnedUsersByMonth"),
      usersByAgeRange: td("sections.usersByAgeRange"),
      revenueByMonth: td("sections.revenueByMonth"),
      promotionsAppliedByMonth: td("sections.promotionsAppliedByMonth"),
    },
    noDataPeriod: td("noDataPeriod"),
    noDataAvailable: td("noDataAvailable"),
    noMetricsSelected: td("noMetricsSelected"),
    summary: td("summary"),
    subtitle: td("subtitle", { owner, date: dateLabel }),
    footer: td("footer"),
  };

  const document = (
    <ReportDocument
      selectedMetrics={selectedMetrics}
      data={metrics}
      gymName={gymName}
      locale={intlLocale}
      labels={labels}
      logoUrl={logoUrl}
      accentColor={accentHex}
    />
  );

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "repeat(5, 1fr)" } }}>
      <Box sx={{ gridColumn: { lg: "span 2" } }}>
        <Box sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 3, boxShadow: (theme) => theme.vars.customShadows.card }}>
          <Typography variant="subtitle2" sx={{ mb: 2.5 }}>
            {t("reportMetrics")}
          </Typography>
          <MetricSelector selected={selected} onChange={setSelected} />

          <Box sx={{ mt: 3, borderTop: "1px solid", borderColor: "divider", pt: 2.5 }}>
            <PDFDownloadLink document={document} fileName="reporte-fitconnect.pdf">
              {({ loading: pdfLoading }) => (
                <Button variant="primary" fullWidth disabled={loading || pdfLoading}>
                  <Iconify icon="solar:download-minimalistic-bold" width={15} />
                  {pdfLoading ? t("preparing") : t("confirmAndDownload")}
                </Button>
              )}
            </PDFDownloadLink>
          </Box>
        </Box>
      </Box>

      <Box sx={{ gridColumn: { lg: "span 3" } }}>
        <Box sx={{ overflow: "hidden", borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: (theme) => theme.vars.customShadows.card }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2.5, py: 1.5 }}>
            <Typography variant="subtitle2">{t("preview")}</Typography>
            <Button size="sm" variant="secondary" onClick={() => setLightboxOpen(true)}>
              <Iconify icon="solar:full-screen-bold" width={13} />
              {t("viewFull")}
            </Button>
          </Stack>
          <Box sx={{ maxHeight: 730, overflowY: "auto", bgcolor: "background.neutral", p: 3 }}>
            <ReportPreviewHtml
              selectedMetrics={selectedMetrics}
              data={metrics}
              gymName={gymName}
              locale={intlLocale}
              labels={labels}
              logoUrl={logoUrl}
            />
          </Box>
        </Box>
      </Box>

      <ReportLightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} document={document} />
    </Box>
  );
}
