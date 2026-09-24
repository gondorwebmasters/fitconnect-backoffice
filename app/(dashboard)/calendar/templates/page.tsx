"use client";

import { useMutation, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Iconify } from "@/components/iconify";
import { DAY_VALUES, toHHMM } from "@/components/calendar/schedule-fields";
import { ScheduleForm } from "@/components/calendar/schedule-form";
import { ScheduleProgrammedForm } from "@/components/calendar/schedule-programmed-form";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/sticky-header";
import { useToast } from "@/components/ui/toast";
import { fullName } from "@/lib/format";
import { DELETE_SCHEDULE_PROGRAMMED, GET_SCHEDULES_PROGRAMMED } from "@/lib/graphql/schedules";
import type { ScheduleProgrammed } from "@/lib/graphql/types";

export default function ScheduleTemplatesPage() {
  const t = useTranslations("calendar.templates");
  const tSchedule = useTranslations("calendar.scheduleForm");
  const toast = useToast();

  const [editing, setEditing] = useState<ScheduleProgrammed | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ScheduleProgrammed | null>(null);

  const { data, loading, refetch } = useQuery<{
    getSchedulesProgrammed: { schedulesProgrammed: ScheduleProgrammed[] | null };
  }>(GET_SCHEDULES_PROGRAMMED);
  const [deleteTemplate, deleteState] = useMutation(DELETE_SCHEDULE_PROGRAMMED);

  const templates = data?.getSchedulesProgrammed?.schedulesProgrammed ?? [];

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const { data: result } = await deleteTemplate({ variables: { ids: [deleting.id] } });
      if (result?.deleteScheduleProgrammed?.success) {
        toast(t("deleted"));
        refetch();
      } else {
        toast(result?.deleteScheduleProgrammed?.message ?? t("deleteFailed"), "error");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : t("deleteFailed"), "error");
    }
    setDeleting(null);
  };

  const columns: Column<ScheduleProgrammed>[] = [
    {
      key: "title",
      header: t("columns.template"),
      render: (template) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {template.title}
          </Typography>
          {template.description ? (
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", maxWidth: 320 }} noWrap>
              {template.description}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      key: "days",
      header: t("columns.days"),
      render: (template) => {
        const days = (template.daysOfWeek ?? []).map(Number);
        return (
          <Stack direction="row" spacing={0.5}>
            {DAY_VALUES.map((day) => (
              <Box
                key={day}
                sx={{
                  height: 24,
                  width: 24,
                  borderRadius: 1,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  ...(days.includes(day)
                    ? { bgcolor: "text.primary", color: "background.paper" }
                    : { color: "text.disabled", border: "1px solid", borderColor: "divider" }),
                }}
              >
                {tSchedule(`dayInitials.${day}`)}
              </Box>
            ))}
          </Stack>
        );
      },
    },
    {
      key: "hours",
      header: t("columns.hours"),
      render: (template) => (
        <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {toHHMM(template.startHour)} – {toHHMM(template.endHour)}
        </Typography>
      ),
    },
    {
      key: "trainer",
      header: t("columns.trainer"),
      render: (template) => (
        <Typography variant="body2">{template.admin ? fullName(template.admin) : "—"}</Typography>
      ),
    },
    {
      key: "spots",
      header: t("columns.spots"),
      render: (template) => <Typography variant="body2">{template.maxUsers}</Typography>,
    },
    {
      key: "allowedPlans",
      header: t("columns.allowedPlans"),
      // Lista vacía = plantilla abierta. Se dice con palabras en vez de dejar la
      // celda en blanco: "sin chips" se lee igual que "no se ha cargado".
      render: (template) =>
        template.allowedPlans.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.disabled" }}>
            {t("openToEveryone")}
          </Typography>
        ) : (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {template.allowedPlans.map((plan) => (
              <Chip key={plan.id} tone="primary">
                {plan.name}
              </Chip>
            ))}
          </Stack>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      // La fila entera abre la edición, pero el lápiz lo hace visible: sin él, la
      // única acción a la vista sería la de borrar.
      render: (template) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setEditing(template);
            }}
            title={t("editTemplate")}
            sx={{ color: "text.disabled" }}
          >
            <Iconify icon="solar:pen-bold" width={22} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setDeleting(template);
            }}
            title={t("deleteTemplate")}
            sx={{ color: "text.disabled" }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={22} />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PageShell
        header={
          <PageHeader
            title={t("title")}
            subtitle={t("subtitle")}
            actions={
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Iconify icon="mingcute:add-line" width={15} />
                {t("newTemplate")}
              </Button>
            }
          />
        }
      >
        <DataTable
          columns={columns}
          rows={templates}
          rowKey={(template) => template.id}
          onRowClick={(template) => setEditing(template)}
          loading={loading}
          emptyMessage={t("emptyTable")}
        />
      </PageShell>

      {/* Crear una plantilla es `createSchedule` con `repeat: true` — el back no
          tiene una mutación aparte —, así que se reutiliza el formulario de clase
          con la serie semanal fijada. Editarla sí tiene la suya. */}
      <ScheduleForm
        open={creating}
        schedule={null}
        forceRepeat
        onClose={() => setCreating(false)}
        onSaved={() => refetch()}
      />

      <ScheduleProgrammedForm
        open={Boolean(editing)}
        template={editing}
        onClose={() => setEditing(null)}
        onSaved={() => refetch()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t("deleteTemplate")}
        description={t("deleteTemplateDescription", { title: deleting?.title ?? "" })}
        confirmLabel={t("delete")}
        danger
        loading={deleteState.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
