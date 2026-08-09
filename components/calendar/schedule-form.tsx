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
import { Dropdown } from "@/components/ui/dropdown";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { fullName } from "@/lib/format";
import { CREATE_SCHEDULE } from "@/lib/graphql/schedules";
import type { User } from "@/lib/graphql/types";
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
};

interface ScheduleFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Preselecciona la fecha al abrir (p. ej. al hacer clic en un día del calendario). */
  initialDate?: Date;
}

export function ScheduleForm({ open, onClose, onCreated, initialDate }: ScheduleFormProps) {
  const t = useTranslations("calendar.scheduleForm");
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open && initialDate) {
      setForm((current) => ({ ...current, date: toDateInputValue(initialDate) }));
    }
  }, [open, initialDate]);

  const DAYS = DAY_VALUES.map((value) => ({ value, label: t(`dayInitials.${value}`) }));
  const TYPE_OPTIONS = TYPE_VALUES.map((value) => ({ value, label: t(`types.${value}`) }));

  const trainers = useQuery<{ getUsers: { users: User[] | null } }>(GET_USERS, {
    variables: { roleFilter: ["admin", "coach"] },
    skip: !open,
  });

  const [createSchedule, { loading }] = useMutation(CREATE_SCHEDULE);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleDay = (day: number) =>
    set(
      "days",
      form.days.includes(day) ? form.days.filter((value) => value !== day) : [...form.days, day],
    );

  const valid =
    form.title &&
    form.description &&
    form.admin &&
    Number(form.maxUsers) > 0 &&
    (form.repeat ? form.days.length > 0 : Boolean(form.date));

  const handleSubmit = async () => {
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
        },
      },
    });
    const result = data?.createSchedule;
    if (result?.success) {
      toast(t("created"));
      setForm(EMPTY_FORM);
      onCreated();
      onClose();
    } else {
      toast(result?.message ?? t("createFailed"), "error");
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={t("newClass")}
      subtitle={form.repeat ? t("weeklySeries") : t("oneTimeClass")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!valid || loading}>
            {loading ? t("creating") : t("createClass")}
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
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TimePicker value={form.startHour} onChange={(value) => set("startHour", value)} placeholder={t("startTime")} />
          <TimePicker value={form.endHour} onChange={(value) => set("endHour", value)} placeholder={t("endTime")} />
        </Box>
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

        <FormControlLabel
          control={<Checkbox checked={form.repeat} onChange={(event) => set("repeat", event.target.checked)} />}
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
      </Stack>
    </SlideOver>
  );
}
