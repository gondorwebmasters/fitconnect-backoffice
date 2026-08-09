"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useColorScheme, useTheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";

import { varAlpha } from "@/theme/styles";
import type { SchedulesStat } from "@/lib/graphql/types";

// El server emite dayAndTime con formato moment "ddd HH:mm"
const DAY_ORDER: Record<string, number> = {
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
  lun: 0, mar: 1, mié: 2, mie: 2, jue: 3, vie: 4, sáb: 5, sab: 5, dom: 6,
};

export function OccupancyHeatmap({ stats, loading }: { stats: SchedulesStat[]; loading?: boolean }) {
  const t = useTranslations("dashboard.occupancyHeatmap");
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const DAY_LABELS = Array.from({ length: 7 }, (_, index) => t(`days.${index}`));

  if (loading) {
    return <Skeleton variant="rounded" height={256} />;
  }

  const cells = new Map<string, number>();
  const timesSet = new Set<string>();
  const daysSet = new Set<number>();

  for (const stat of stats) {
    const [dayRaw, time] = stat.dayAndTime.split(" ");
    const day = DAY_ORDER[dayRaw?.toLowerCase().replace(".", "") ?? ""];
    if (day === undefined || !time) continue;
    timesSet.add(time);
    daysSet.add(day);
    cells.set(`${day}-${time}`, stat.ratio);
  }

  const times = [...timesSet].sort();
  const days = [...daysSet].sort((a, b) => a - b);

  if (times.length === 0) {
    return (
      <Typography variant="body2" sx={{ py: 8, textAlign: "center", color: "text.disabled" }}>
        {t("empty")}
      </Typography>
    );
  }

  const primaryChannel = colorScheme === "dark" ? theme.vars.palette.primary.lightChannel : theme.vars.palette.primary.mainChannel;

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "2px",
          "@keyframes cellIn": {
            from: { opacity: 0, transform: "scale(0.6)" },
            to: { opacity: 1, transform: "scale(1)" },
          },
        }}
      >
        <thead>
          <tr>
            <th />
            {times.map((time) => (
              <Box key={time} component="th" sx={{ pb: 0.5, textAlign: "center", fontSize: 10, fontWeight: 400, color: "text.disabled" }}>
                {time}
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, dayIndex) => (
            <tr key={day}>
              <Box component="td" sx={{ pr: 1, textAlign: "right", fontSize: 10, color: "text.disabled" }}>
                {DAY_LABELS[day]}
              </Box>
              {times.map((time, timeIndex) => {
                const ratio = cells.get(`${day}-${time}`);
                return (
                  <Box
                    component="td"
                    key={time}
                    title={
                      ratio === undefined
                        ? t("cellEmpty", { day: DAY_LABELS[day], time })
                        : t("cellFilled", { day: DAY_LABELS[day], time, ratio: Math.round(ratio) })
                    }
                    sx={{
                      height: 32,
                      minWidth: 32,
                      borderRadius: 1,
                      transition: (theme) => theme.transitions.create("transform", { duration: 150 }),
                      "&:hover": { transform: "scale(1.1)" },
                      bgcolor:
                        ratio === undefined
                          ? "background.neutral"
                          : varAlpha(primaryChannel, Math.max(0.12, Math.min(ratio, 100) / 100)),
                      animation: "cellIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
                      animationDelay: `${(dayIndex * times.length + timeIndex) * 8}ms`,
                    }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </Box>
      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1} sx={{ mt: 1.5, fontSize: 10, color: "text.disabled" }}>
        <Box component="span">0%</Box>
        <Stack direction="row" spacing={0.5}>
          {[0.12, 0.25, 0.5, 0.75, 1].map((alpha) => (
            <Box key={alpha} sx={{ height: 12, width: 24, borderRadius: 0.5, bgcolor: varAlpha(primaryChannel, alpha) }} />
          ))}
        </Stack>
        <Box component="span">{t("legendFull")}</Box>
      </Stack>
    </Box>
  );
}
