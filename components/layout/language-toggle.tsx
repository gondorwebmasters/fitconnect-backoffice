"use client";

import { FlagIcon } from "@/components/iconify";

import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Popover } from "@/components/ui/popover";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locales";

const LOCALE_FLAG: Record<Locale, string> = { es: "es", pt: "pt" };
const LOCALES: Locale[] = ["es", "pt"];

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const selectLocale = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    startTransition(() => router.refresh());
  };

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      panelSx={{ width: 200 }}
      trigger={
        <IconButton
          onClick={() => setOpen((value) => !value)}
          disabled={pending}
          aria-label={t("label")}
          size="small"
        >
          <FlagIcon code={LOCALE_FLAG[locale]} sx={{ width: 26, height: 20 }} />
        </IconButton>
      }
    >
      <List dense sx={{ py: 0.5 }}>
        {LOCALES.map((value) => (
          <ListItemButton key={value} selected={value === locale} onClick={() => selectLocale(value)} sx={{ borderRadius: 1, mx: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <FlagIcon code={LOCALE_FLAG[value]} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: "body2", fontWeight: value === locale ? 600 : 400 }}>
              {t(value)}
            </ListItemText>
          </ListItemButton>
        ))}
      </List>
    </Popover>
  );
}
