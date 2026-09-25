"use client";

import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";

import { DURATION, EASE_OUT, SPRING, SPRING_SNAPPY, staggerDelay } from "@/lib/motion";

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
      transition={{ duration: DURATION.slow, delay: staggerDelay(index), ease: EASE_OUT }}
      whileHover={{ y: -2, transition: SPRING }}
      whileTap={{ scale: 0.99, transition: SPRING_SNAPPY }}
      sx={{
        p: 3,
        minWidth: 0,
        overflow: "hidden",
        boxShadow: theme.vars.customShadows.card,
        transition: "box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": { boxShadow: theme.vars.customShadows.z16 },
      }}
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
