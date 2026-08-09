"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { METRIC_GROUPS, METRICS, type MetricId, metricsInGroup } from "./metrics-catalog";

interface MetricSelectorProps {
  selected: Set<MetricId>;
  onChange: (next: Set<MetricId>) => void;
}

export function MetricSelector({ selected, onChange }: MetricSelectorProps) {
  const t = useTranslations("reports.metrics");
  const toggle = (id: MetricId) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const selectAll = () => onChange(new Set(METRICS.map((metric) => metric.id)));
  const clearAll = () => onChange(new Set());
  const selectOnly = (ids: MetricId[]) => onChange(new Set(ids));

  return (
    <Stack spacing={3}>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        <Button size="sm" variant="secondary" onClick={selectAll}>
          {t("selectAll")}
        </Button>
        <Button size="sm" variant="ghost" onClick={clearAll}>
          {t("clearSelection")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => selectOnly(metricsInGroup("financial"))}>
          {t("onlyRevenue")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => selectOnly(metricsInGroup("users"))}>
          {t("onlyUsers")}
        </Button>
      </Stack>

      {METRIC_GROUPS.map((group) => (
        <Stack key={group.id} spacing={1}>
          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.disabled" }}>
            {t(`groups.${group.id}`)}
          </Typography>
          <Stack spacing={0.5}>
            {METRICS.filter((metric) => metric.group === group.id).map((metric) => (
              <Stack
                key={metric.id}
                component="label"
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  px: 1,
                  py: 0.75,
                  fontSize: 14,
                  color: "text.secondary",
                  transition: (theme) => theme.transitions.create("background-color"),
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Checkbox checked={selected.has(metric.id)} onChange={() => toggle(metric.id)} />
                {t(`ids.${metric.id}`)}
              </Stack>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
