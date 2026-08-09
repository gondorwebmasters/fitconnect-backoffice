"use client";

import { useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { StatusChip } from "@/components/mui/status-chip";
import { formatDateTime } from "@/lib/format";
import { GET_USER_SCHEDULES } from "@/lib/graphql/schedules";
import type { Schedule } from "@/lib/graphql/types";

export function SchedulesTab({ userId }: { userId: string }) {
  const t = useTranslations("members.schedulesTab");
  const [view, setView] = useState("upcoming");

  const { data, loading } = useQuery<{ getUserSchedules: { schedules: Schedule[] | null } }>(
    GET_USER_SCHEDULES,
    { variables: { userId, past: view === "past" } },
  );

  const schedules = data?.getUserSchedules?.schedules ?? [];

  return (
    <Stack spacing={2}>
      <Tabs value={view} onChange={(_event, value: string) => setView(value)} sx={{ minHeight: 36 }}>
        <Tab value="upcoming" label={t("upcoming")} sx={{ minHeight: 36 }} />
        <Tab value="past" label={t("past")} sx={{ minHeight: 36 }} />
      </Tabs>
      {loading && !data ? (
        <Skeleton variant="rounded" height={96} />
      ) : schedules.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 3 }}>
          {t("empty")}
        </Typography>
      ) : (
        <List disablePadding>
          {schedules.map((schedule) => (
            <ListItem key={schedule.id} divider sx={{ px: 0 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{schedule.title}</Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  {formatDateTime(schedule.startDate)}
                </Typography>
              </Box>
              <StatusChip
                tone={schedule.state === "cancelled" ? "negative" : "positive"}
                label={schedule.state === "cancelled" ? t("cancelled") : t("available")}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
