"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import type { ReportMetricsData } from "@/lib/graphql/reports";

import { FULL_CHART_LAYOUT } from "./chart-geometry";
import { HtmlAreaChart } from "./html-area-chart";
import { HtmlBarChart } from "./html-bar-chart";
import { HtmlVerticalBarChart } from "./html-vertical-bar-chart";
import type { MetricId, ReportLabels } from "./metrics-catalog";

interface ReportPreviewHtmlProps {
  selectedMetrics: MetricId[];
  data: ReportMetricsData;
  gymName: string;
  locale: string;
  labels: ReportLabels;
  logoUrl?: string;
}

/**
 * Espejo en HTML/CSS de `ReportDocument`, usado solo para la vista previa
 * inline. Recompilar el binario PDF (@react-pdf/renderer) en cada cambio de
 * checkbox recarga el iframe del PDFViewer entero y produce un parpadeo
 * visible — este componente es DOM normal, así que React solo reconcilia,
 * sin flash. El PDF real (para el lightbox y la descarga) sigue siendo
 * `ReportDocument`.
 *
 * Espeja una página de papel impresa: colores fijos (blanco/gris oscuro),
 * no los tokens del tema — un informe no cambia con el modo claro/oscuro.
 */
export function ReportPreviewHtml({
  selectedMetrics,
  data,
  gymName,
  locale,
  labels,
  logoUrl,
}: ReportPreviewHtmlProps) {
  const formatEuros = (cents: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents);
  const has = (id: MetricId) => selectedMetrics.includes(id);

  const kpis: { id: MetricId; label: string; value: string }[] = [
    has("totalUsers") ? { id: "totalUsers", label: labels.kpis.totalUsers, value: String(data.totalUsers) } : null,
    has("churnedUsers") ? { id: "churnedUsers", label: labels.kpis.churnedUsers, value: String(data.churnedUsers) } : null,
    has("totalRevenue")
      ? { id: "totalRevenue", label: labels.kpis.totalRevenue, value: formatEuros(data.totalRevenue) }
      : null,
    has("productsSold")
      ? { id: "productsSold", label: labels.kpis.productsSold, value: String(data.productsSold) }
      : null,
    has("promotionsApplied")
      ? { id: "promotionsApplied", label: labels.kpis.promotionsApplied, value: String(data.promotionsApplied) }
      : null,
  ].filter((kpi): kpi is { id: MetricId; label: string; value: string } => kpi !== null);

  const metricSections: { key: string; title: string; chart: ReactNode; list: ReactNode }[] = [];

  if (has("newUsersByMonth")) {
    const points = data.newUsersByMonth.map((item) => ({ label: item.month, value: item.count }));
    metricSections.push({
      key: "newUsersByMonth",
      title: labels.sections.newUsersByMonth,
      chart: points.length > 0 ? <HtmlVerticalBarChart layout={FULL_CHART_LAYOUT} data={points} /> : null,
      list:
        points.length > 0 ? (
          <HtmlBarChart data={points} />
        ) : (
          <Typography sx={{ fontSize: 11, color: "#71717a" }}>{labels.noDataPeriod}</Typography>
        ),
    });
  }

  if (has("churnedUsersByMonth")) {
    const points = data.churnedUsersByMonth.map((item) => ({ label: item.month, value: item.count }));
    metricSections.push({
      key: "churnedUsersByMonth",
      title: labels.sections.churnedUsersByMonth,
      chart: points.length > 0 ? <HtmlVerticalBarChart layout={FULL_CHART_LAYOUT} data={points} /> : null,
      list:
        points.length > 0 ? (
          <HtmlBarChart data={points} />
        ) : (
          <Typography sx={{ fontSize: 11, color: "#71717a" }}>{labels.noDataPeriod}</Typography>
        ),
    });
  }

  if (has("usersByAgeRange")) {
    const points = data.usersByAgeRange.map((item) => ({ label: item.range, value: item.count }));
    metricSections.push({
      key: "usersByAgeRange",
      title: labels.sections.usersByAgeRange,
      chart: points.length > 0 ? <HtmlVerticalBarChart layout={FULL_CHART_LAYOUT} data={points} /> : null,
      list:
        points.length > 0 ? (
          <HtmlBarChart data={points} />
        ) : (
          <Typography sx={{ fontSize: 11, color: "#71717a" }}>{labels.noDataAvailable}</Typography>
        ),
    });
  }

  if (has("revenueByMonth")) {
    const points = data.revenueByMonth.map((item) => ({ label: item.month, value: item.amount }));
    metricSections.push({
      key: "revenueByMonth",
      title: labels.sections.revenueByMonth,
      chart:
        points.length > 0 ? (
          <HtmlAreaChart layout={FULL_CHART_LAYOUT} data={points} formatValue={formatEuros} />
        ) : null,
      list:
        points.length > 0 ? (
          <HtmlBarChart data={points} formatValue={formatEuros} />
        ) : (
          <Typography sx={{ fontSize: 11, color: "#71717a" }}>{labels.noDataAvailable}</Typography>
        ),
    });
  }

  if (has("promotionsAppliedByMonth")) {
    const points = data.promotionsAppliedByMonth.map((item) => ({ label: item.month, value: item.count }));
    metricSections.push({
      key: "promotionsAppliedByMonth",
      title: labels.sections.promotionsAppliedByMonth,
      chart: points.length > 0 ? <HtmlVerticalBarChart layout={FULL_CHART_LAYOUT} data={points} /> : null,
      list:
        points.length > 0 ? (
          <HtmlBarChart data={points} />
        ) : (
          <Typography sx={{ fontSize: 11, color: "#71717a" }}>{labels.noDataPeriod}</Typography>
        ),
    });
  }

  return (
    <Box
      sx={{
        position: "relative",
        mx: "auto",
        aspectRatio: "210 / 297",
        width: "100%",
        maxWidth: 720,
        overflowY: "auto",
        bgcolor: "#fff",
        p: 4,
        color: "#18181b",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt=""
          aria-hidden
          sx={{
            pointerEvents: "none",
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "46%",
            transform: "translate(-50%, -50%)",
            opacity: 0.1,
          }}
        />
      ) : null}

      <Box sx={{ position: "relative", mb: 2.5, borderBottom: "1.5px solid", borderColor: "primary.main", pb: 1.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#18181b" }}>{gymName}</Typography>
        <Typography sx={{ mt: 0.25, fontSize: 11, color: "#71717a" }}>{labels.subtitle}</Typography>
      </Box>

      <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 2.5 }}>
        {selectedMetrics.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>{labels.noMetricsSelected}</Typography>
        ) : null}

        {kpis.length > 0 ? (
          <Box component="section">
            <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 700, color: "#18181b" }}>{labels.summary}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
              {kpis.map((kpi) => (
                <Box key={kpi.id} sx={{ width: 150, borderRadius: 1.5, border: "1px solid #e4e4e7", bgcolor: "#fafafa", p: 1.25 }}>
                  <Typography sx={{ mb: 0.5, fontSize: 9, color: "#71717a" }}>{kpi.label}</Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#18181b" }}>{kpi.value}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}

        {metricSections.map((section) => (
          <Box component="section" key={section.key}>
            <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 700, color: "#18181b" }}>{section.title}</Typography>
            {section.chart ? <Box sx={{ mb: 1.25 }}>{section.chart}</Box> : null}
            {section.list}
          </Box>
        ))}
      </Box>

      <Typography sx={{ position: "relative", mt: 4, borderTop: "1px solid #f4f4f5", pt: 1, textAlign: "center", fontSize: 9, color: "#a1a1aa" }}>
        {labels.footer}
      </Typography>
    </Box>
  );
}
