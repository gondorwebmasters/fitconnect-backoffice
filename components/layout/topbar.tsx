"use client";

import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useShell } from "./app-shell";
import { CompanySwitcher } from "./company-switcher";
import { LanguageToggle } from "./language-toggle";
import { NotificationsBell } from "./notifications-bell";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const { openPalette } = useShell();
  const t = useTranslations("topbar");
  const [scrolled, setScrolled] = useState(false);

  // Barra fija a todo lo ancho tipo Material AppBar: gana una sombra sutil
  // al hacer scroll para separarse visualmente del contenido que pasa por debajo.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Stack
      component={motion.header}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        height: 64,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        px: { xs: 2, lg: 3 },
        transition: (theme) => theme.transitions.create("box-shadow", { duration: 300 }),
        boxShadow: scrolled ? (theme) => theme.vars.customShadows.z8 : "none",
      }}
    >
      <Box sx={{ flex: 1 }} />

      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Stack
          component={motion.button}
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={openPalette}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          sx={{
            height: 36,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            px: 1.5,
            fontSize: 12,
            color: "text.disabled",
            transition: (theme) => theme.transitions.create(["border-color", "color"]),
            "&:hover": { borderColor: "text.disabled", color: "text.secondary" },
          }}
        >
          <Iconify icon="eva:search-fill" width={18} />
          <Box component="span" sx={{ display: { xs: "none", md: "block" } }}>
            {t("search")}
          </Box>
          <Box
            component="kbd"
            sx={{
              display: { xs: "none", md: "block" },
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.neutral",
              px: 0.75,
              py: "1px",
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              color: "text.disabled",
            }}
          >
            ⌘K
          </Box>
        </Stack>

        <Box sx={{ height: 24, width: "1px", flexShrink: 0, bgcolor: "divider" }} />

        <CompanySwitcher />

        <Stack direction="row" alignItems="center" spacing={0.25}>
          <NotificationsBell />
          <LanguageToggle />
          <ThemeToggle />
        </Stack>

        <ProfileMenu />
      </Stack>
    </Stack>
  );
}
