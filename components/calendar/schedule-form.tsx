"use client";

import { useMutation, useQuery } from "@apollo/client";
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
import { fullName } from "@/lib/format";
import { LIST_PLANS } from "@/lib/graphql/plans";
import { CREATE_SCHEDULE, UPDATE_SCHEDULE } from "@/lib/graphql/schedules";
import type { Plan, Schedule, User } from "@/lib/graphql/types";
import { GET_USERS } from "@/lib/graphql/users";

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Convención del server: 0 = domingo … 6 = sábado (ver DAY_MAPPING en la app móvil)
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

const TYPE_VALUES = ["standard", "sparring", "free", "conditioning", "competition"] as const;

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
    allowedPlanIds: (schedule.allowedPlans ?? []).map((plan) => plan.id),
  };
}

interface ScheduleFormProps {
  open: boolean;
  schedule: Schedule | null; // null = crear
  onClose: () => void;
  onSaved: () => void;
  /** Preselecciona la fecha al abrir (p. ej. al hacer clic en un día del calendario). */
  initialDate?: Date;
}

export function ScheduleForm({ open, schedule, onClose, onSaved, initialDate }: ScheduleFormProps) {
  const t = useTranslations("calendar.scheduleForm");
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const editing = Boolean(schedule);

  useEffect(() => {
    if (schedule) {
      setForm(formFromSchedule(schedule));
    } else {
      setForm(initialDate ? { ...EMPTY_FORM, date: toDateInputValue(initialDate) } : EMPTY_FORM);
    }
  }, [schedule, open, initialDate]);

  const DAYS = DAY_VALUES.map((value) => ({ value, label: t(`dayInitials.${value}`) }));
  const TYPE_OPTIONS = TYPE_VALUES.map((value) => ({ value, label: t(`types.${value}`) }));

  const trainers = useQuery<{ getUsers: { users: User[] | null } }>(GET_USERS, {
    variables: { roleFilter: ["admin", "coach"] },
    skip: !open,
  });

  // `showGlobal` queda en false a propósito: solo los planes de la propia empresa
  // pueden restringir una clase suya (el back lo ancla además en la BD).
  const plans = useQuery<{ listPlans: { plans: Plan[] | null } }>(LIST_PLANS, {
    variables: { onlyActive: true, showGlobal: false },
    skip: !open,
  });

  const [createSchedule, createState] = useMutation(CREATE_SCHEDULE);
  const [updateSchedule, updateState] = useMutation(UPDATE_SCHEDULE);
  const loading = createState.loading || updateState.loading;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleDay = (day: number) =>
    set(
      "days",
      form.days.includes(day) ? form.days.filter((value) => value !== day) : [...form.days, day],
    );

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
            // La restricción de la plantilla semanal aún no existe (#12) y el back
            // rechaza pedirla con repeat: true, así que solo viaja en clase puntual.
            allowedPlanIds: form.repeat ? undefined : form.allowedPlanIds,
          },
        },
      });
      const result = data?.createSchedule;
      if (result?.success) {
        toast(t("created"));
        setForm(EMPTY_FORM);
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
      title={editing ? t("editTitle") : t("newClass")}
      subtitle={editing ? t("editSubtitle") : form.repeat ? t("weeklySeries") : t("oneTimeClass")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!valid || loading}>
            {loading ? (editing ? t("saving") : t("creating")) : editing ? t("saveChanges") : t("createClass")}
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
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Field label={t("type")}>
            <Dropdown options={TYPE_OPTIONS} value={form.type} onChange={(value) => set("type", value)} />
          </Field>
          <Field label={t("spots")}>
            <Input
              type="number"
              min={1}
              value={form.maxUsers}
              onChange={(event) => set("maxUsers", event.target.value)}
            />
          </Field>
        </Box>
        {!editing ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TimePicker value={form.startHour} onChange={(value) => set("startHour", value)} placeholder={t("startTime")} />
            <TimePicker value={form.endHour} onChange={(value) => set("endHour", value)} placeholder={t("endTime")} />
          </Box>
        ) : null}
        <Field label={t("trainer")}>
          <Dropdown
            options={(trainers.data?.getUsers?.users ?? []).map((user) => ({
              value: user.id,
              label: fullName(user),
            }))}
            placeholder={t("select")}
            searchable
            value={form.admin}
            onChange={(value) => set("admin", value)}
          />
        </Field>

        {editing || !form.repeat ? (
          <Field label={t("allowedPlans")} hint={t("allowedPlansHint")}>
            <MultiDropdown
              options={(plans.data?.listPlans?.plans ?? []).map((plan) => ({
                value: plan.id,
                label: plan.name,
              }))}
              placeholder={t("allowedPlansPlaceholder")}
              value={form.allowedPlanIds}
              onChange={(value) => set("allowedPlanIds", value)}
            />
          </Field>
        ) : null}

        {!editing ? (
          <>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.repeat}
                onChange={(event) =>
                  // La serie semanal no admite restricción todavía: al activarla se
                  // descarta la selección en vez de dejarla puesta y perderla al guardar.
                  setForm((current) => ({
                    ...current,
                    repeat: event.target.checked,
                    allowedPlanIds: event.target.checked ? [] : current.allowedPlanIds,
                  }))
                }
              />
            }
            label={t("repeatWeekly")}
            slotProps={{ typography: { variant: "body2", color: "text.secondary" } }}
          />

          {form.repeat ? (
            <Field label={t("daysOfWeek")}>
              <Stack direction="row" spacing={1}>
                {DAYS.map((day) => (
                  <Box
                    key={day.value}
                    component="button"
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    sx={{
                      height: 36,
                      width: 36,
                      borderRadius: 2,
                      border: "1px solid",
                      fontSize: 14,
                      cursor: "pointer",
                      transition: (theme) => theme.transitions.create(["background-color", "border-color", "color"]),
                      ...(form.days.includes(day.value)
                        ? { borderColor: "text.primary", bgcolor: "text.primary", color: "background.paper" }
                        : { borderColor: "divider", color: "text.secondary", "&:hover": { borderColor: "text.disabled" } }),
                    }}
                  >
                    {day.label}
                  </Box>
                ))}
              </Stack>
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
