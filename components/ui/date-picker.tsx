"use client";

import { MobileDatePicker as MuiDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { MobileDateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { MobileTimePicker as MuiTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { useTranslations } from "next-intl";

interface DatePickerProps {
  /** Fecha en formato `YYYY-MM-DD` (o `YYYY-MM-DDTHH:mm` con withTime), o vacío para "sin selección". */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Añade selector de hora; el valor pasa a formato `YYYY-MM-DDTHH:mm` (como `datetime-local`). */
  withTime?: boolean;
}

function parseISODate(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;
  if (timePart) {
    const [hours, minutes] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hours || 0, minutes || 0);
  }
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toISODateTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toISODate(date)}T${hours}:${minutes}`;
}

/**
 * Selector de fecha (y hora opcional): envoltorio delgado sobre
 * @mui/x-date-pickers con la misma API (`value`/`onChange` como string ISO)
 * que tenía la versión anterior basada en react-day-picker.
 */
export function DatePicker({ value, onChange, placeholder, className, withTime = false }: DatePickerProps) {
  const t = useTranslations("ui.datePicker");
  const selected = parseISODate(value);

  if (withTime) {
    return (
      <MuiDateTimePicker
        value={selected}
        onChange={(date) => date && onChange(toISODateTime(date))}
        label={placeholder ?? t("selectDate")}
        className={className}
        slotProps={{ textField: { fullWidth: true } }}
      />
    );
  }

  return (
    <MuiDatePicker
      value={selected}
      onChange={(date) => date && onChange(toISODate(date))}
      label={placeholder ?? t("selectDate")}
      className={className}
      slotProps={{ textField: { fullWidth: true } }}
    />
  );
}

function parseHHMM(value: string): Date | null {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function toHHMM(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Selector de hora (formato `HH:mm`, sin fecha): reemplaza el input nativo
 * `type="time"` del navegador por el picker de @mui/x-date-pickers, fiel al
 * estilo Minimals en vez del control del sistema operativo.
 */
export function TimePicker({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("ui.datePicker");
  return (
    <MuiTimePicker
      value={parseHHMM(value)}
      onChange={(date) => date && onChange(toHHMM(date))}
      label={placeholder ?? t("time")}
      className={className}
      ampm={false}
      slotProps={{ textField: { fullWidth: true } }}
    />
  );
}
