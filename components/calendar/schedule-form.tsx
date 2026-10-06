"use client";

import { useMutation } from "@apollo/client";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker, TimePicker } from "@/components/ui/date-picker";
import { Dropdown, MultiDropdown } from "@/components/ui/dropdown";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { CREATE_SCHEDULE, UPDATE_SCHEDULE } from "@/lib/graphql/schedules";
import type { Schedule } from "@/lib/graphql/types";

import { DayOfWeekPicker, usePlanOptions, useScheduleTypeOptions, useTrainerOptions } from "./schedule-fields";

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "standard",
  startHour: "09:00",
  endHour: "10:00",
  maxUsers: "15",
  admin: "",
  repeat: false,
  date: "",
  days: [] as number[],
  allowedPlanIds: [] as string[],
};

/** Rellena el formulario con los campos editables de una clase existente. */
function formFromSchedule(schedule: Schedule) {
  return {
    ...EMPTY_FORM,
    title: schedule.title,
    description: schedule.description ?? "",
    type: schedule.type,
    maxUsers: String(schedule.maxUsers),
    admin: schedule.admin?.id ?? "",
    allowedPlanIds: schedule.allowedPlans.map((plan) => plan.id),
  };
}

interface ScheduleFormProps {
  open: boolean;
  schedule: Schedule | null; // null = crear
  onClose: () => void;
  onSaved: () => void;
  /** Preselecciona la fecha al abrir (p. ej. al hacer clic en un día del calendario). */
  initialDate?: Date;
  /**
   * Fuerza la serie semanal y oculta la casilla: lo usa la pantalla de plantillas,
   * donde crear una clase puntual no tendría sentido. Solo aplica al crear.
   */
  forceRepeat?: boolean;
}

export function ScheduleForm({ open, schedule, onClose, onSaved, initialDate, forceRepeat }: ScheduleFormProps) {
  const t = useTranslations("calendar.scheduleForm");
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const editing = Boolean(schedule);

  useEffect(() => {
    if (schedule) {
      setForm(formFromSchedule(schedule));
    } else {
      setForm({
        ...EMPTY_FORM,
        repeat: Boolean(forceRepeat),
        ...(initialDate && !forceRepeat ? { date: toDateInputValue(initialDate) } : {}),
      });
    }
  }, [schedule, open, initialDate, forceRepeat]);

  const typeOptions = useScheduleTypeOptions();
  const trainerOptions = useTrainerOptions(open);
  const planOptions = usePlanOptions(open, schedule?.allowedPlans);

  const [createSchedule, createState] = useMutation(CREATE_SCHEDULE);
  const [updateSchedule, updateState] = useMutation(UPDATE_SCHEDULE);
  const loading = createState.loading || updateState.loading;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Al crear hay que decir además de qué va la clase y cuándo es; al editar esos
  // campos no se tocan, y la descripción puede venir vacía de una clase antigua.
  const whenValid = form.repeat ? form.days.length > 0 : Boolean(form.date);
  const valid =
    form.title &&
    form.admin &&
    Number(form.maxUsers) > 0 &&
    (editing || (form.description && whenValid));

  const handleUpdate = async () => {
    if (!schedule) return;
    // Los errores de validación del back llegan como excepción (GraphQL error), no en `ServiceResponse`.
    try {
      const { data } = await updateSchedule({
        variables: {
          schedule: {
            id: schedule.id,
            title: form.title,
            description: form.description,
            type: form.type,
            maxUsers: Number(form.maxUsers),
            admin: form.admin,
            // Se manda siempre, también vacío: el formulario muestra la restricción
            // vigente, así que una lista vacía es una orden de quitarla, no un "no tocar".
            allowedPlanIds: form.allowedPlanIds,
          },
        },
      });
      const result = data?.updateSchedule;
      if (result?.success) {
        toast(t("updated"));
        onSaved();
        onClose();
      } else {
        toast(result?.message ?? t("updateFailed"), "error");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : t("updateFailed"), "error");
    }
  };

  const handleCreate = async () => {
    try {
      const { data } = await createSchedule({
        variables: {
          schedule: {
            title: form.title,
            description: form.description,
            type: form.type,
            startHour: form.startHour,
            endHour: form.endHour,
            maxUsers: Number(form.maxUsers),
            admin: form.admin,
            repeat: form.repeat,
            days: form.repeat ? form.days : form.date ? [new Date(form.date).getDay()] : [],
            date: form.repeat ? undefined : form.date,
            // Viaja igual en serie que en clase puntual: con repeat la restricción
            // se guarda en la plantilla, que la siembra en cada schedule que
            // engendra (#12), en vez de re-marcarlos uno a uno cada semana.
            allowedPlanIds: form.allowedPlanIds,
          },
        },
      });
      const result = data?.createSchedule;
      if (result?.success) {
        toast(t("created"));
        setForm({ ...EMPTY_FORM, repeat: Boolean(forceRepeat) });
        onSaved();
        onClose();
      } else {
        toast(result?.message ?? t("createFailed"), "error");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : t("createFailed"), "error");
    }
  };

  const handleSubmit = editing ? handleUpdate : handleCreate;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={editing ? t("editTitle") : forceRepeat ? t("newTemplate") : t("newClass")}
      subtitle={editing ? t("editSubtitle") : form.repeat ? t("weeklySeries") : t("oneTimeClass")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!valid || loading}>
            {loading
              ? editing
                ? t("saving")
                : t("creating")
              : editing
                ? t("saveChanges")
                : forceRepeat
                  ? t("createTemplate")
                  : t("createClass")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5}>
        <Field label={t("title")}>
          <Input value={form.title} onChange={(event) => set("title", event.target.value)} />
        </Field>
        <Field label={t("description")}>
          <Textarea value={form.description} onChange={(event) => set("description", event.target.value)} />
        </Field>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignItems: "start", gap: 2 }}>
          <Dropdown
            label={t("type")}
            options={typeOptions}
            value={form.type}
            onChange={(value) => set("type", value)}
          />
          <Input
            label={t("spots")}
            type="number"
            min={1}
            value={form.maxUsers}
            onChange={(event) => set("maxUsers", event.target.value)}
          />
        </Box>
        {!editing ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignItems: "start", gap: 2 }}>
            <TimePicker value={form.startHour} onChange={(value) => set("startHour", value)} placeholder={t("startTime")} />
            <TimePicker value={form.endHour} onChange={(value) => set("endHour", value)} placeholder={t("endTime")} />
          </Box>
        ) : null}
        <Field label={t("trainer")}>
          <Dropdown
            options={trainerOptions}
            placeholder={t("select")}
            searchable
            value={form.admin}
            onChange={(value) => set("admin", value)}
          />
        </Field>

        <Field
          label={t("allowedPlans")}
          hint={form.repeat ? t("allowedPlansSeriesHint") : t("allowedPlansHint")}
        >
          <MultiDropdown
            options={planOptions}
            placeholder={t("allowedPlansPlaceholder")}
            value={form.allowedPlanIds}
            onChange={(value) => set("allowedPlanIds", value)}
          />
        </Field>

        {!editing ? (
          <>
          {!forceRepeat ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.repeat}
                  onChange={(event) => set("repeat", event.target.checked)}
                />
              }
              label={t("repeatWeekly")}
              slotProps={{ typography: { variant: "body2", color: "text.secondary" } }}
            />
          ) : null}

          {form.repeat ? (
            <Field label={t("daysOfWeek")}>
              <DayOfWeekPicker value={form.days} onChange={(days) => set("days", days)} />
            </Field>
          ) : (
            <DatePicker value={form.date} onChange={(value) => set("date", value)} placeholder={t("date")} />
          )}
          </>
        ) : null}
      </Stack>
    </SlideOver>
  );
}
