"use client";

import { useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { fullName } from "@/lib/format";
import { LIST_PLANS } from "@/lib/graphql/plans";
import type { Plan, ScheduleAllowedPlan, User } from "@/lib/graphql/types";
import { GET_USERS } from "@/lib/graphql/users";

/**
 * Lo que comparten el formulario de clase y el de plantilla semanal. Los dos
 * editan la misma cosa —título, aforo, entrenador, planes admitidos— y se
 * diferencian en cuándo ocurre: una fecha suelta frente a unos días de la semana.
 * Tenerlo aquí evita que una regla (p. ej. qué planes se ofrecen) se arregle en
 * uno y se quede vieja en el otro.
 */

/** Convención del server: 0 = domingo … 6 = sábado. El orden es el de lectura, lunes primero. */
export const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

export const TYPE_VALUES = ["standard", "sparring", "free", "conditioning", "competition"] as const;

/** El back devuelve `time` de Postgres (`HH:mm:ss`); aquí se trabaja en `HH:mm`. */
export function toHHMM(value: string): string {
  const [hours = "", minutes = ""] = value.split(":");
  return `${hours}:${minutes}`;
}

/** Opciones de tipo de clase ya traducidas. */
export function useScheduleTypeOptions() {
  const t = useTranslations("calendar.scheduleForm");
  return TYPE_VALUES.map((value) => ({ value, label: t(`types.${value}`) }));
}

/** Entrenadores asignables: admins y coaches de la empresa. */
export function useTrainerOptions(open: boolean) {
  const { data } = useQuery<{ getUsers: { users: User[] | null } }>(GET_USERS, {
    variables: { roleFilter: ["admin", "coach"] },
    skip: !open,
  });
  return (data?.getUsers?.users ?? []).map((user) => ({ value: user.id, label: fullName(user) }));
}

/**
 * Planes que se pueden exigir: los activos de la propia empresa más los que ya
 * estén puestos en `current`.
 *
 * `showGlobal: false` a propósito — solo los planes de la propia empresa pueden
 * restringir algo suyo (el back lo ancla además en la BD).
 *
 * Lo de unir `current` no es cosmético: un plan archivado sigue restringiendo en
 * el back pero `onlyActive: true` no lo devuelve. Sin unirlo, el selector no
 * pintaría su chip, el formulario mentiría sobre la restricción vigente y, como
 * `allowedPlanIds` viaja siempre, guardar cualquier otro cambio la borraría sin
 * que el administrador lo viera. Archivado sigue sin poder elegirse de nuevo:
 * solo aparece si ya estaba puesto.
 */
export function usePlanOptions(open: boolean, current: ScheduleAllowedPlan[] | undefined) {
  const { data } = useQuery<{ listPlans: { plans: Plan[] | null } }>(LIST_PLANS, {
    variables: { onlyActive: true, showGlobal: false },
    skip: !open,
  });

  return useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    for (const plan of data?.listPlans?.plans ?? []) {
      options.set(plan.id, { value: plan.id, label: plan.name });
    }
    for (const plan of current ?? []) {
      if (!options.has(plan.id)) options.set(plan.id, { value: plan.id, label: plan.name });
    }
    return [...options.values()];
  }, [data, current]);
}

/** Selector de días de la semana: una tecla por día, marcadas las que se repiten. */
export function DayOfWeekPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  const t = useTranslations("calendar.scheduleForm");
  const toggle = (day: number) =>
    onChange(value.includes(day) ? value.filter((current) => current !== day) : [...value, day]);

  return (
    <Stack direction="row" spacing={1}>
      {DAY_VALUES.map((day) => (
        <Box
          key={day}
          component="button"
          type="button"
          onClick={() => toggle(day)}
          sx={{
            height: 36,
            width: 36,
            borderRadius: 2,
            border: "1px solid",
            fontSize: 14,
            cursor: "pointer",
            transition: (theme) => theme.transitions.create(["background-color", "border-color", "color"]),
            ...(value.includes(day)
              ? { borderColor: "text.primary", bgcolor: "text.primary", color: "background.paper" }
              : { borderColor: "divider", color: "text.secondary", "&:hover": { borderColor: "text.disabled" } }),
          }}
        >
          {t(`dayInitials.${day}`)}
        </Box>
      ))}
    </Stack>
  );
}
