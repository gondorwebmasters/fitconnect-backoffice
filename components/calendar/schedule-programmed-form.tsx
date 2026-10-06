"use client";

import { useMutation } from "@apollo/client";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/ui/date-picker";
import { Dropdown, MultiDropdown } from "@/components/ui/dropdown";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { UPDATE_SCHEDULE_PROGRAMMED } from "@/lib/graphql/schedules";
import type { ScheduleProgrammed } from "@/lib/graphql/types";

import {
  DayOfWeekPicker,
  toHHMM,
  usePlanOptions,
  useScheduleTypeOptions,
  useTrainerOptions,
} from "./schedule-fields";

function formFromTemplate(template: ScheduleProgrammed) {
  return {
    title: template.title,
    description: template.description ?? "",
    // `as string`: el Dropdown trabaja en strings y el back valida el enum. Sin
    // esto el tipo del formulario quedaría clavado a ScheduleType y no aceptaría
    // lo que devuelve el selector.
    type: (template.type ?? "standard") as string,
    startHour: toHHMM(template.startHour),
    endHour: toHHMM(template.endHour),
    maxUsers: String(template.maxUsers),
    admin: template.admin?.id ?? "",
    days: (template.daysOfWeek ?? []).map(Number),
    allowedPlanIds: template.allowedPlans.map((plan) => plan.id),
  };
}

interface ScheduleProgrammedFormProps {
  open: boolean;
  template: ScheduleProgrammed | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Edición de una plantilla semanal (el `ScheduleProgrammed` del back). A
 * diferencia del formulario de clase, aquí sí se tocan días y horas: son lo que
 * define la plantilla. Guardar **pisa todos los schedules futuros** de los días
 * que se conservan —restricción incluida, haya divergido o no—, y por eso el
 * aviso está siempre a la vista, no escondido en un tooltip.
 */
export function ScheduleProgrammedForm({ open, template, onClose, onSaved }: ScheduleProgrammedFormProps) {
  const t = useTranslations("calendar.templates.form");
  const tSchedule = useTranslations("calendar.scheduleForm");
  const toast = useToast();
  const [form, setForm] = useState(() => (template ? formFromTemplate(template) : null));

  useEffect(() => {
    setForm(template ? formFromTemplate(template) : null);
  }, [template, open]);

  const typeOptions = useScheduleTypeOptions();
  const trainerOptions = useTrainerOptions(open);
  const planOptions = usePlanOptions(open, template?.allowedPlans);

  const [updateTemplate, updateState] = useMutation(UPDATE_SCHEDULE_PROGRAMMED);

  const set = <K extends keyof NonNullable<typeof form>>(key: K, value: NonNullable<typeof form>[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  const valid = Boolean(
    form && form.title && form.description && form.admin && Number(form.maxUsers) > 0 && form.days.length > 0,
  );

  const handleSubmit = async () => {
    if (!template || !form) return;
    // Los errores de validación del back llegan como excepción (GraphQL error), no en `ServiceResponse`.
    try {
      const { data } = await updateTemplate({
        variables: {
          scheduleProgrammed: {
            id: template.id,
            title: form.title,
            description: form.description,
            type: form.type,
            startHour: form.startHour,
            endHour: form.endHour,
            maxUsers: Number(form.maxUsers),
            admin: form.admin,
            daysOfWeek: form.days,
            // Se manda siempre, también vacía: el formulario muestra la restricción
            // vigente, así que una lista vacía es una orden de quitarla —de la
            // plantilla y de sus schedules futuros—, no un "no tocar".
            allowedPlanIds: form.allowedPlanIds,
          },
        },
      });
      const result = data?.updateScheduleProgrammed;
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

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={t("editTitle")}
      subtitle={t("editSubtitle")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {tSchedule("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!valid || updateState.loading}>
            {updateState.loading ? tSchedule("saving") : tSchedule("saveChanges")}
          </Button>
        </>
      }
    >
      {form ? (
        <Stack spacing={2.5}>
          <Alert severity="warning" sx={{ alignItems: "center" }}>
            {t("overwriteWarning")}
          </Alert>

          <Field label={tSchedule("title")}>
            <Input value={form.title} onChange={(event) => set("title", event.target.value)} />
          </Field>
          <Field label={tSchedule("description")}>
            <Textarea value={form.description} onChange={(event) => set("description", event.target.value)} />
          </Field>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Field label={tSchedule("type")}>
              <Dropdown options={typeOptions} value={form.type} onChange={(value) => set("type", value)} />
            </Field>
            <Field label={tSchedule("spots")}>
              <Input
                type="number"
                min={1}
                value={form.maxUsers}
                onChange={(event) => set("maxUsers", event.target.value)}
              />
            </Field>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TimePicker
              value={form.startHour}
              onChange={(value) => set("startHour", value)}
              placeholder={tSchedule("startTime")}
            />
            <TimePicker
              value={form.endHour}
              onChange={(value) => set("endHour", value)}
              placeholder={tSchedule("endTime")}
            />
          </Box>
          <Field label={tSchedule("trainer")}>
            <Dropdown
              options={trainerOptions}
              placeholder={tSchedule("select")}
              searchable
              value={form.admin}
              onChange={(value) => set("admin", value)}
            />
          </Field>

          <Field label={tSchedule("daysOfWeek")} hint={t("daysHint")}>
            <DayOfWeekPicker value={form.days} onChange={(days) => set("days", days)} />
          </Field>

          <Field label={tSchedule("allowedPlans")} hint={t("allowedPlansHint")}>
            <MultiDropdown
              options={planOptions}
              placeholder={tSchedule("allowedPlansPlaceholder")}
              value={form.allowedPlanIds}
              onChange={(value) => set("allowedPlanIds", value)}
            />
          </Field>
        </Stack>
      ) : null}
    </SlideOver>
  );
}
