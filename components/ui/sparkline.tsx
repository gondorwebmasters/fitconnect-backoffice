"use client";

import { useTheme } from "@mui/material/styles";

import { Chart } from "@/components/chart";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  variant?: "bar" | "area";
  color?: string;
}

/**
 * Mini-gráfico de tendencia decorativo (serie única, sin ejes ni leyenda).
 * El valor real siempre debe mostrarse como texto junto a él — el sparkline
 * solo aporta forma de la tendencia.
 */
export function Sparkline({ data, width = 64, height = 32, variant = "bar", color }: SparklineProps) {
  const theme = useTheme();

  if (data.length < 2) return null;

  const resolvedColor = color ?? theme.palette.primary.main;

  if (variant === "bar") {
    return (
      <Chart
        type="bar"
        series={[{ data }]}
        width={width}
        height={height}
        options={{
          chart: { sparkline: { enabled: true } },
          colors: [resolvedColor],
          plotOptions: { bar: { columnWidth: "55%", borderRadius: 1.5 } },
          tooltip: { enabled: false },
        }}
      />
    );
  }

  return (
    <Chart
      type="area"
      series={[{ data }]}
      width={width}
      height={height}
      options={{
        chart: { sparkline: { enabled: true } },
        colors: [resolvedColor],
        stroke: { width: 2, curve: "smooth" },
        fill: { type: "gradient", gradient: { shadeIntensity: 0, opacityFrom: 0.35, opacityTo: 0, stops: [0, 100] } },
        tooltip: { enabled: false },
        markers: { size: 0 },
      }}
    />
  );
}
