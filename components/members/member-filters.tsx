"use client";
import { Iconify } from "@/components/iconify";

import Autocomplete from "@mui/material/Autocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useTranslations } from "next-intl";

export function useRoleOptions() {
  const t = useTranslations("members.filters.roleOptions");
  return [
    { value: "standard", label: t("standard") },
    { value: "coach", label: t("coach") },
    { value: "admin", label: t("admin") },
  ];
}

export function useStateOptions() {
  const t = useTranslations("members.filters.stateOptions");
  return [
    { value: "new", label: t("new") },
    { value: "pending", label: t("pending") },
    { value: "inactive", label: t("inactive") },
    { value: "blocked", label: t("blocked") },
    { value: "notVerified", label: t("notVerified") },
  ];
}

interface Option {
  value: string;
  label: string;
}

interface MemberFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  role: string;
  onRole: (value: string) => void;
  /** Omitido en /members (el filtro de estado vive en las pestañas de la tabla). */
  state?: string;
  onState?: (value: string) => void;
}

export function MemberFilters({ search, onSearch, role, onRole, state, onState }: MemberFiltersProps) {
  const t = useTranslations("members.filters");
  const roleOptions = useRoleOptions();
  const stateOptions = useStateOptions();

  return (
    <Stack direction="row" flexWrap="wrap" spacing={1.5} sx={{ mb: 3 }}>
      <Autocomplete
        size="small"
        options={roleOptions}
        value={roleOptions.find((option) => option.value === role) ?? null}
        onChange={(_event, newValue: Option | null) => onRole(newValue?.value ?? "")}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        sx={{ width: 176 }}
        renderInput={(params) => <TextField {...params} placeholder={t("allRoles")} />}
      />
      <TextField
        size="small"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        sx={{ flex: 1, minWidth: 240 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={18} />
              </InputAdornment>
            ),
          },
        }}
      />
      {state !== undefined && onState ? (
        <Autocomplete
          size="small"
          options={stateOptions}
          value={stateOptions.find((option) => option.value === state) ?? null}
          onChange={(_event, newValue: Option | null) => onState(newValue?.value ?? "")}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          sx={{ width: 208 }}
          renderInput={(params) => <TextField {...params} placeholder={t("allStates")} />}
        />
      ) : null}
    </Stack>
  );
}
