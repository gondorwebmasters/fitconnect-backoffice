"use client";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/ui/page-header";

const SETTINGS_TABS = [
  { href: "/settings", key: "general" },
  { href: "/settings/finance", key: "finance" },
  { href: "/settings/onboarding", key: "onboarding" },
  { href: "/settings/danger", key: "danger" },
] as const;

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("settings.layout");

  const activeTab =
    SETTINGS_TABS.find((tab) => (tab.href === "/settings" ? pathname === tab.href : pathname.startsWith(tab.href)))
      ?.href ?? "/settings";

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Tabs value={activeTab} aria-label={t("tabsAriaLabel")} sx={{ mb: 4 }}>
        {SETTINGS_TABS.map((tab) => (
          <Tab
            key={tab.href}
            value={tab.href}
            label={t(`tabs.${tab.key}`)}
            component={Link}
            href={tab.href}
            sx={tab.href === "/settings/danger" ? { "&.Mui-selected": { color: "error.main" } } : undefined}
          />
        ))}
      </Tabs>
      <Box>{children}</Box>
    </>
  );
}
