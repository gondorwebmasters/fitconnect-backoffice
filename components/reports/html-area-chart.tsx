import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

import { buildPoints, buildSmoothLinePath, FULL_CHART_LAYOUT, type ChartLayout } from "./chart-geometry";

interface HtmlAreaChartProps {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  color?: string;
  layout?: ChartLayout;
}

/** Espejo DOM/SVG de `PdfAreaChart`, usado solo para la vista previa inline. */
export function HtmlAreaChart({ data, formatValue, color, layout = FULL_CHART_LAYOUT }: HtmlAreaChartProps) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.vars.palette.primary.main;
  const format = formatValue ?? ((value: number) => String(value));
  const { points, baseline } = buildPoints(data, layout);
  const gradientId = "report-preview-area-fill";

  const linePath = buildSmoothLinePath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x},${baseline} L ${points[0].x},${baseline} Z`
      : "";

  return (
    <Box component="svg" viewBox={`0 0 ${layout.width} ${layout.height}`} sx={{ width: "100%", color: resolvedColor }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.32} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>

      <path
        d={`M ${layout.padding.left},${baseline} L ${layout.width - layout.padding.right},${baseline}`}
        stroke="#E4E4E7"
        strokeWidth={0.75}
      />

      {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
      {linePath ? (
        <path d={linePath} stroke="currentColor" strokeWidth={1.75} fill="none" strokeLinecap="round" />
      ) : null}

      {points.map((point) => (
        <circle key={point.label} cx={point.x} cy={point.y} r={2} fill="currentColor" />
      ))}

      {points.map((point) => (
        <text key={`${point.label}-value`} x={point.x} y={point.y - 6} textAnchor="middle" fontSize={7} fill="#18181B">
          {format(point.value)}
        </text>
      ))}

      {points.map((point) => (
        <text key={`${point.label}-label`} x={point.x} y={baseline + 12} textAnchor="middle" fontSize={7} fill="#71717A">
          {point.label}
        </text>
      ))}
    </Box>
  );
}
