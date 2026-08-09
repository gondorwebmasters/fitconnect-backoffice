"use client";
import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";

import { ACCENT_HEX, ACCENT_IDS } from "@/theme/accents";
import { useSettingsContext } from "@/theme/settings";

type ThemeMode = "light" | "dark" | "system";

export function AppearanceCard() {
  const t = useTranslations("profile.appearanceCard");
  const { mode, setMode } = useColorScheme();
  const { primaryColor, setPrimaryColor } = useSettingsContext();
  const resolvedMode: ThemeMode = mode ?? "system";

  const MODES: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "light", label: t("modes.light"), icon: "solar:sun-bold" },
    { value: "dark", label: t("modes.dark"), icon: "solar:moon-bold" },
    { value: "system", label: t("modes.system"), icon: "solar:monitor-bold" },
  ];

  return (
    <Card variant="outlined">
      <CardHeader title={t("title")} subheader={t("subtitle")} titleTypographyProps={{ variant: "subtitle1" }} />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t("mode")}
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            color="primary"
            value={resolvedMode}
            onChange={(_event, value: ThemeMode | null) => value && setMode(value)}
            aria-label={t("modeAriaLabel")}
          >
            {MODES.map(({ value, label, icon }) => (
              <ToggleButton
                key={value}
                value={value}
                sx={{
                  gap: 1,
                  textTransform: "none",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                }}
              >
                <Iconify icon={icon} width={14} />
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t("accentColor")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, pt: 0.5 }}>
            {ACCENT_IDS.map((id) => (
              <Box
                key={id}
                component="button"
                type="button"
                onClick={() => setPrimaryColor(id)}
                aria-label={t(`accentNames.${id}`)}
                aria-pressed={primaryColor === id}
                title={t(`accentNames.${id}`)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: "none",
                  padding: 0,
                  transition: (theme) => theme.transitions.create("transform"),
                  bgcolor: ACCENT_HEX[id].main,
                  outline: primaryColor === id ? "2px solid" : "none",
                  outlineColor: "primary.main",
                  outlineOffset: 2,
                  "&:hover": { transform: "scale(1.1)" },
                }}
              >
                {primaryColor === id ? (
                  <Iconify icon="eva:checkmark-fill" width={15} color={ACCENT_HEX[id].contrastText} />
                ) : null}
              </Box>
            ))}
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}
