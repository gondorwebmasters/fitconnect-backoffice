"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";

import { Iconify } from "@/components/iconify";

import { AnimatedNumber } from "./animated-number";
import { Sparkline } from "./sparkline";

interface StatCardProps {
  label: string;
  value: number | string;
  /** Variación relativa (ej. +12.5 → "▲ 12,5 %"). */
  delta?: number;
  deltaLabel?: string;
  detail?: string;
  trend?: number[];
  /** Color del sparkline de barras (por defecto, el primary del tema). */
  trendColor?: "primary" | "info" | "success" | "warning" | "error";
  loading?: boolean;
  index?: number;
}

function DeltaRow({ delta, deltaLabel }: { delta: number; deltaLabel?: string }) {
  const icon = delta > 0 ? "solar:arrow-right-up-linear" : delta < 0 ? "solar:arrow-right-down-linear" : "solar:minus-circle-bold";
  const color = delta > 0 ? "success.main" : delta < 0 ? "error.main" : "text.disabled";

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, minWidth: 0, flexWrap: "wrap", rowGap: 0.25 }}>
      <Iconify icon={icon} width={14} sx={{ color, flexShrink: 0 }} />
      <Typography
        variant="caption"
        sx={{ color, fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}
      >
        {Math.abs(delta).toLocaleString("es-ES", { maximumFractionDigits: 1 })}%
      </Typography>
      {deltaLabel ? (
        <Typography
          variant="caption"
          sx={{ color: "text.disabled", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {deltaLabel}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  detail,
  trend,
  trendColor = "primary",
  loading,
  index = 0,
}: StatCardProps) {
  const theme = useTheme();
  const sparklineColor = theme.palette[trendColor].main;

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      sx={{ p: 3, minWidth: 0, overflow: "hidden", boxShadow: theme.vars.customShadows.card }}
    >
      <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 600 }}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={80} height={40} sx={{ mt: 1 }} />
      ) : (
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1.5} sx={{ mt: 1 }}>
          <Typography variant="h4" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </Typography>
          {trend && trend.length > 1 ? (
            <Box sx={{ flexShrink: 0, lineHeight: 0 }}>
              <Sparkline data={trend} width={64} height={32} color={sparklineColor} />
            </Box>
          ) : null}
        </Stack>
      )}
      {!loading && delta !== undefined ? <DeltaRow delta={delta} deltaLabel={deltaLabel} /> : null}
      {!loading && delta === undefined && detail ? (
        <Typography variant="caption" sx={{ color: "text.disabled", mt: 1, display: "block" }}>
          {detail}
        </Typography>
      ) : null}
    </Card>
  );
}
