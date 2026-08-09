import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

import { FULL_CHART_LAYOUT, roundedTopRectPath, type ChartLayout } from "./chart-geometry";

interface HtmlVerticalBarChartProps {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  color?: string;
  layout?: ChartLayout;
}

const BAR_GAP_RATIO = 0.42;

/** Espejo DOM/SVG de `PdfVerticalBarChart`, usado solo para la vista previa inline. */
export function HtmlVerticalBarChart({ data, formatValue, color, layout = FULL_CHART_LAYOUT }: HtmlVerticalBarChartProps) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.vars.palette.primary.main;
  const format = formatValue ?? ((value: number) => String(value));
  const { width, height, padding } = layout;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const baseline = padding.top + plotHeight;
  const max = Math.max(1, ...data.map((item) => item.value));

  const slot = data.length > 0 ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(40, slot * (1 - BAR_GAP_RATIO));

  const bars = data.map((item, index) => {
    const centerX = padding.left + slot * index + slot / 2;
    const barHeight = (item.value / max) * plotHeight;
    return {
      label: item.label,
      value: item.value,
      x: centerX - barWidth / 2,
      y: baseline - barHeight,
      height: barHeight,
      centerX,
    };
  });

  return (
    <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", color: resolvedColor }}>
      <path d={`M ${padding.left},${baseline} L ${width - padding.right},${baseline}`} stroke="#E4E4E7" strokeWidth={0.75} />

      {bars.map((bar, index) => (
        <path
          key={bar.label}
          d={roundedTopRectPath(bar.x, bar.y, barWidth, bar.height, 4)}
          fill="currentColor"
          fillOpacity={Math.max(0.55, 1 - index * 0.08)}
        />
      ))}

      {bars.map((bar) => (
        <text key={`${bar.label}-value`} x={bar.centerX} y={bar.y - 4} textAnchor="middle" fontSize={7} fill="#18181B">
          {format(bar.value)}
        </text>
      ))}

      {bars.map((bar) => (
        <text key={`${bar.label}-label`} x={bar.centerX} y={baseline + 12} textAnchor="middle" fontSize={7} fill="#71717A">
          {bar.label}
        </text>
      ))}
    </Box>
  );
}
