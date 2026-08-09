"use client";

import { Iconify } from "@/components/iconify";

import { useMutation } from "@apollo/client";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { BadgeDot } from "@/components/ui/badge-dot";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { varAlpha } from "@/theme/styles";
import { formatDateTime, formatTime, fullName } from "@/lib/format";
import {
  CHANGE_SCHEDULE_STATUS,
  REMOVE_SCHEDULE,
  REMOVE_USER_FROM_SCHEDULE,
} from "@/lib/graphql/schedules";
import type { Schedule } from "@/lib/graphql/types";

interface SchedulePanelProps {
  schedule: Schedule | null;
  onClose: () => void;
  onChanged: () => void;
}

export function SchedulePanel({ schedule, onClose, onChanged }: SchedulePanelProps) {
  const t = useTranslations("calendar.schedulePanel");
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [changeStatus, statusState] = useMutation(CHANGE_SCHEDULE_STATUS, { onCompleted: onChanged });
  const [removeUser] = useMutation(REMOVE_USER_FROM_SCHEDULE, { onCompleted: onChanged });
  const [removeSchedule, removeState] = useMutation(REMOVE_SCHEDULE);

  const cancelled = schedule?.state === "cancelled";

  const handleDelete = async () => {
    if (!schedule) return;
    const { data } = await removeSchedule({ variables: { scheduleId: schedule.id } });
    if (data?.removeSchedule?.success) {
      toast(t("deleted"));
      onChanged();
      onClose();
    } else {
      toast(data?.removeSchedule?.message ?? t("deleteFailed"), "error");
      setConfirmDelete(false);
    }
  };

  return (
    <SlideOver
      open={Boolean(schedule)}
      onClose={onClose}
      title={schedule?.title ?? ""}
      subtitle={schedule ? `${formatDateTime(schedule.startDate)} – ${formatTime(schedule.endDate)}` : undefined}
      footer={
        schedule ? (
          <>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              {t("delete")}
            </Button>
            <Button
              variant={cancelled ? "primary" : "secondary"}
              disabled={statusState.loading}
              onClick={() => changeStatus({ variables: { scheduleId: schedule.id } })}
            >
              {statusState.loading ? "…" : cancelled ? t("reactivate") : t("cancelClass")}
            </Button>
          </>
        ) : undefined
      }
    >
      {schedule ? (
        <Stack spacing={3}>
          <Box sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2, boxShadow: (theme) => theme.vars.customShadows.card }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <BadgeDot
                tone={cancelled ? "negative" : "positive"}
                label={cancelled ? t("cancelled") : t("available")}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>
                {schedule.users?.length ?? 0}/{schedule.maxUsers}{" "}
                <Box component="span" sx={{ fontWeight: 400, color: "text.disabled" }}>
                  {t("spots")}
                </Box>
              </Typography>
            </Stack>
            {!cancelled ? (
              <Box sx={{ mt: 1.5, display: "block", height: 6, width: "100%", overflow: "hidden", borderRadius: 999, bgcolor: "action.hover" }}>
                <Box
                  sx={{
                    display: "block",
                    height: "100%",
                    borderRadius: 999,
                    bgcolor: "primary.main",
                    transition: (theme) => theme.transitions.create("width", { duration: 300 }),
                    width: `${Math.min(((schedule.users?.length ?? 0) / (schedule.maxUsers || 1)) * 100, 100)}%`,
                  }}
                />
              </Box>
            ) : null}
          </Box>

          {schedule.description ? (
            <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
              {schedule.description}
            </Typography>
          ) : null}

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <Box sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 1.5, boxShadow: (theme) => theme.vars.customShadows.z1 }}>
              <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "text.disabled" }}>
                {t("type")}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 600, color: "text.secondary" }}>
                {schedule.type}
              </Typography>
            </Box>
            <Box sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 1.5, boxShadow: (theme) => theme.vars.customShadows.z1 }}>
              <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "text.disabled" }}>
                {t("trainer")}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 600, color: "text.secondary" }}>
                {fullName(schedule.admin)}
              </Typography>
            </Box>
          </Box>

          <Box component="section">
            <Typography variant="caption" sx={{ mb: 1.5, display: "block", textTransform: "uppercase", letterSpacing: "0.04em", color: "text.disabled" }}>
              {t("attendees", { count: schedule.users?.length ?? 0 })}
            </Typography>
            {(schedule.users ?? []).length === 0 ? (
              <Typography variant="body2" sx={{ py: 1.5, color: "text.disabled" }}>
                {t("noAttendees")}
              </Typography>
            ) : (
              <Box component="ul" sx={{ overflow: "hidden", borderRadius: 3, border: "1px solid", borderColor: "divider", listStyle: "none", m: 0, p: 0 }}>
                {(schedule.users ?? []).map((user, index) => (
                  <Stack
                    component="li"
                    key={user.id}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      transition: (theme) => theme.transitions.create("background-color"),
                      "&:hover": { bgcolor: "action.hover" },
                      ...(index > 0 && { borderTop: "1px solid", borderColor: "divider" }),
                    }}
                  >
                    <Avatar size="sm" name={fullName(user)} url={user.pictureUrl?.url} />
                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, color: "text.secondary" }}>
                      {fullName(user)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => removeUser({ variables: { scheduleId: schedule.id, userId: user.id } })}
                      title={t("removeFromClass")}
                      sx={{ color: "text.disabled", "&:hover": { bgcolor: (theme) => varAlpha(theme.vars.palette.error.mainChannel, 0.08), color: "error.main" } }}
                    >
                      <Iconify icon="solar:user-block-rounded-bold" width={15} />
                    </IconButton>
                  </Stack>
                ))}
              </Box>
            )}
            {(schedule.waitListUsers ?? []).length > 0 ? (
              <Typography variant="caption" sx={{ mt: 1.5, display: "block", color: "text.disabled" }}>
                {t("waitList")}: {(schedule.waitListUsers ?? []).map((user) => fullName(user)).join(", ")}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title={t("deleteClass")}
        description={t("deleteClassDescription")}
        confirmLabel={t("delete")}
        danger
        loading={removeState.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SlideOver>
  );
}
