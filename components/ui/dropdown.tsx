"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** MUI Autocomplete siempre permite buscar; se mantiene la prop por compatibilidad. */
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  /** "small" solo para barras de filtro compactas; el resto de la app usa el tamaño medio por defecto. */
  size?: "small" | "medium";
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  clearable = false,
  disabled = false,
  sx,
  size = "medium",
}: DropdownProps) {
  return (
    <Autocomplete
      size={size}
      sx={sx}
      disabled={disabled}
      disableClearable={!clearable}
      options={options}
      value={options.find((option) => option.value === value) ?? null}
      onChange={(_event, newValue) => onChange(newValue?.value ?? "")}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      renderInput={(params) => <TextField {...params} placeholder={placeholder} />}
    />
  );
}
