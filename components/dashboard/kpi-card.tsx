"use client";

import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";

import { AnimatedNumber } from "@/components/ui/animated-number";

export function KpiCard({
  label,
  value,
  detail,
  loading,
  index = 0,
}: {
  label: string;
  value: number | string;
  detail?: string;
  loading?: boolean;
  index?: number;
}) {
  const theme = useTheme();

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      sx={{ p: 3, boxShadow: theme.vars.customShadows.card }}
    >
      <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 600 }}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={64} height={40} sx={{ mt: 1 }} />
      ) : (
        <Typography variant="h4" sx={{ mt: 1, fontVariantNumeric: "tabular-nums" }}>
          {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
        </Typography>
      )}
      {detail ? (
        <Typography variant="caption" sx={{ mt: 1, display: "block", color: "text.disabled" }}>
          {detail}
        </Typography>
      ) : null}
    </Card>
  );
}
