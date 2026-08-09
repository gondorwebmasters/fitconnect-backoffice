"use client";

import MuiCheckbox from "@mui/material/Checkbox";
import type { CheckboxProps } from "@mui/material/Checkbox";

export function Checkbox(props: CheckboxProps) {
  return <MuiCheckbox size="small" {...props} />;
}
