"use client";

import IconButton from "@mui/material/IconButton";
import { useColorScheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";

import { Iconify } from "@/components/iconify";

type ThemeMode = "light" | "dark" | "system";

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "system",
  system: "light",
};

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const t = useTranslations("themeToggle");

  // `mode` is undefined until MUI resolves the stored preference on the
  // client — avoids a hydration mismatch (equivalent to the old `mounted` guard).
  const resolvedMode: ThemeMode = mode ?? "system";
  const icon = resolvedMode === "light" ? "solar:sun-bold" : resolvedMode === "dark" ? "solar:moon-bold" : "solar:monitor-bold";
  const label = t(resolvedMode);

  return (
    <IconButton
      onClick={() => setMode(NEXT_MODE[resolvedMode])}
      aria-label={label}
      title={label}
      size="small"
      sx={{ color: "text.disabled" }}
    >
      <Iconify icon={mode ? icon : "solar:sun-bold"} width={20} />
    </IconButton>
  );
}
