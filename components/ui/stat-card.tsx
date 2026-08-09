"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
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
  loading?: boolean;
  index?: number;
}

function DeltaBadge({ delta, deltaLabel }: { delta: number; deltaLabel?: string }) {
  const icon = delta > 0 ? "solar:arrow-right-up-linear" : delta < 0 ? "solar:arrow-right-down-linear" : "solar:minus-circle-bold";
  const color = delta > 0 ? "success" : delta < 0 ? "error" : "text.disabled";

  return (
    <Stack alignItems="flex-end" spacing={0.25} sx={{ flexShrink: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          borderRadius: 999,
          px: 1,
          py: 0.5,
          typography: "caption",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          bgcolor: delta === 0 ? "action.hover" : `${color}.lighter`,
          color: delta === 0 ? "text.disabled" : `${color}.dark`,
        }}
      >
        <Iconify icon={icon} width={12} />
        {Math.abs(delta).toLocaleString("es-ES", { maximumFractionDigits: 1 })}%
      </Stack>
      {deltaLabel ? (
        <Typography variant="caption" sx={{ color: "text.disabled", whiteSpace: "nowrap" }}>
          {deltaLabel}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function StatCard({ label, value, delta, deltaLabel, detail, trend, loading, index = 0 }: StatCardProps) {
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      variant="outlined"
      sx={{ p: 3 }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </Typography>
        {delta !== undefined && !loading ? <DeltaBadge delta={delta} deltaLabel={deltaLabel} /> : null}
      </Stack>
      {loading ? (
        <Skeleton variant="text" width={80} height={40} sx={{ mt: 1 }} />
      ) : (
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1.5} sx={{ mt: 1 }}>
          <Typography variant="h4" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </Typography>
          {trend && trend.length > 1 ? <Box sx={{ flexShrink: 0 }}><Sparkline data={trend} /></Box> : null}
        </Stack>
      )}
      {detail ? (
        <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>
          {detail}
        </Typography>
      ) : null}
    </Card>
  );
}
