"use client";

import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CalendarViewName } from "./use-calendar";

const VIEW_OPTIONS = [
  { value: "dayGridMonth", icon: "solar:widget-2-outline" },
  { value: "timeGridWeek", icon: "mdi:view-column-outline" },
  { value: "timeGridDay", icon: "mdi:view-day-outline" },
  { value: "listWeek", icon: "mdi:view-agenda-outline" },
] as const;

interface CalendarToolbarProps {
  date: string;
  view: CalendarViewName;
  loading: boolean;
  onToday: () => void;
  onNextDate: () => void;
  onPrevDate: () => void;
  onChangeView: (view: CalendarViewName) => void;
  labels: { today: string; views: Record<CalendarViewName, string> };
}

export function CalendarToolbar({
  date,
  view,
  loading,
  onToday,
  onNextDate,
  onPrevDate,
  onChangeView,
  labels,
}: CalendarToolbarProps) {
  return (
    <Box
      sx={{
        p: 2.5,
        pr: 2,
        position: "relative",
        display: "grid",
        alignItems: "center",
        gridTemplateColumns: "1fr auto 1fr",
        columnGap: 2,
      }}
    >
      <ToggleButtonGroup
        size="small"
        exclusive
        value={view}
        onChange={(_event, next: CalendarViewName | null) => next && onChangeView(next)}
        sx={{ justifySelf: "start", display: { xs: "none", sm: "inline-flex" } }}
      >
        {VIEW_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value} sx={{ px: 1.25 }}>
            <Tooltip title={labels.views[option.value]}>
              <Box component="span" sx={{ display: "inline-flex" }}>
                <Iconify icon={option.icon} width={18} />
              </Box>
            </Tooltip>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ justifySelf: "center" }}>
        <IconButton onClick={onPrevDate}>
          <Iconify icon="eva:arrow-ios-back-fill" />
        </IconButton>
        <Typography variant="h6" sx={{ textTransform: "capitalize", minWidth: 160, textAlign: "center" }}>
          {date}
        </Typography>
        <IconButton onClick={onNextDate}>
          <Iconify icon="eva:arrow-ios-forward-fill" />
        </IconButton>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ justifySelf: "end" }}>
        <Button size="small" color="error" variant="contained" onClick={onToday}>
          {labels.today}
        </Button>
      </Stack>

      {loading ? (
        <LinearProgress
          color="inherit"
          sx={{ left: 0, width: 1, height: 2, bottom: 0, borderRadius: 0, position: "absolute" }}
        />
      ) : null}
    </Box>
  );
}
