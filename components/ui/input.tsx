"use client";

import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { DatePicker, TimePicker } from "./date-picker";
import { PhoneInput } from "@/components/phone-input";

// Native attributes TextFieldProps doesn't declare at the top level — MUI
// expects these nested under `slotProps.htmlInput` instead.
const NATIVE_INPUT_KEYS = ["min", "max", "step", "pattern", "inputMode", "minLength", "maxLength"] as const;
type NativeInputProps = Partial<Record<(typeof NATIVE_INPUT_KEYS)[number], string | number>>;

function splitNativeProps<T extends NativeInputProps>(props: T) {
  const native: NativeInputProps = {};
  const rest = { ...props };
  for (const key of NATIVE_INPUT_KEYS) {
    if (key in rest) {
      native[key] = rest[key];
      delete rest[key];
    }
  }
  return { native, rest };
}

/**
 * `TextField` manages its own label (floating inside the notched border, the
 * Minimals look) — no separate caption needed above it. `Field` below only
 * exists for the handful of call sites wrapping something that ISN'T a
 * TextField (a color swatch row, a group of checkboxes); there it still
 * renders its own caption.
 */
function mergeHtmlInputSlot(slotProps: TextFieldProps["slotProps"], native: NativeInputProps) {
  const htmlInput = (slotProps as { htmlInput?: object } | undefined)?.htmlInput;
  return { ...slotProps, htmlInput: { ...native, ...htmlInput } };
}

export function Input(props: TextFieldProps & NativeInputProps) {
  const { native, rest } = splitNativeProps(props);
  const { slotProps, ...other } = rest;
  return <TextField fullWidth {...other} slotProps={mergeHtmlInputSlot(slotProps, native)} />;
}

export function Textarea(props: TextFieldProps & NativeInputProps) {
  const { native, rest } = splitNativeProps(props);
  const { slotProps, ...other } = rest;
  return (
    <TextField
      fullWidth
      multiline
      minRows={3}
      {...other}
      slotProps={mergeHtmlInputSlot(slotProps, native)}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  // A single TextField/Textarea child gets the label injected as its own
  // native floating label instead of a separate caption above it.
  if (isValidElement(children) && (children.type === Input || children.type === Textarea)) {
    const withLabel = cloneElement(children as ReactElement<TextFieldProps>, { label, helperText: hint });
    return withLabel;
  }

  // DatePicker/TimePicker render their own floating label too, but read it
  // via `placeholder` (see components/ui/date-picker.tsx), not `label`.
  if (isValidElement(children) && (children.type === DatePicker || children.type === TimePicker)) {
    return cloneElement(children as ReactElement<{ placeholder?: string }>, { placeholder: label });
  }

  // PhoneInput's underlying TextField also has its own floating label.
  if (isValidElement(children) && children.type === PhoneInput) {
    return cloneElement(children as ReactElement<{ label?: string; helperText?: ReactNode }>, { label, helperText: hint });
  }

  return (
    <>
      <Typography
        variant="caption"
        sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", mb: 0.75 }}
      >
        {label}
      </Typography>
      {children}
      {hint ? (
        <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.75 }}>
          {hint}
        </Typography>
      ) : null}
    </>
  );
}
