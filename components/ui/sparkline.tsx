"use client";

import { useTheme } from "@mui/material/styles";

import { Chart } from "@/components/chart";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

/**
 * Mini-gráfico de tendencia decorativo (serie única, sin ejes ni leyenda).
 * El valor real siempre debe mostrarse como texto junto a él — el sparkline
 * solo aporta forma de la tendencia.
 */
export function Sparkline({ data, width = 96, height = 28 }: SparklineProps) {
  const theme = useTheme();

  if (data.length < 2) return null;

  return (
    <Chart
      type="area"
      series={[{ data }]}
      width={width}
      height={height}
      options={{
        chart: { sparkline: { enabled: true } },
        colors: [theme.palette.primary.main],
        stroke: { width: 2, curve: "smooth" },
        fill: { type: "gradient", gradient: { shadeIntensity: 0, opacityFrom: 0.35, opacityTo: 0, stops: [0, 100] } },
        tooltip: { enabled: false },
        markers: { size: 0 },
      }}
    />
  );
}
