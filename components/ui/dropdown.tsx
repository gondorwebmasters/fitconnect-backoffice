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
  /** Etiqueta flotante dentro del borde (igual que Input); `Field` la inyecta. */
  label?: string;
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
  label,
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
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} />}
    />
  );
}

interface MultiDropdownProps {
  options: DropdownOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  size?: "small" | "medium";
}

/**
 * Variante de `Dropdown` para seleccionar varias opciones. Misma forma de opción y
 * el mismo Autocomplete de MUI; el valor es la lista de `value` seleccionados y el
 * placeholder desaparece cuando ya hay alguno para no competir con los chips.
 */
export function MultiDropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  disabled = false,
  sx,
  size = "medium",
}: MultiDropdownProps) {
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      size={size}
      sx={sx}
      disabled={disabled}
      options={options}
      value={options.filter((option) => value.includes(option.value))}
      onChange={(_event, newValue) => onChange(newValue.map((option) => option.value))}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      renderInput={(params) => (
        <TextField {...params} placeholder={value.length > 0 ? undefined : placeholder} />
      )}
    />
  );
}
