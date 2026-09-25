"use client";

import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import { GlassIconButton } from "@/components/ui/glass-icon-button";
import Stack from "@mui/material/Stack";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { DURATION, EASE_OUT, SPRING, SPRING_SNAPPY } from "@/lib/motion";
import { varAlpha } from "@/theme/styles";

import { useShell } from "./app-shell";
import { CompanySwitcher } from "./company-switcher";
import { LanguageToggle } from "./language-toggle";
import { NotificationsBell } from "./notifications-bell";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const { openPalette, toggleMobileNav } = useShell();
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
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        height: 64,
        // Material translúcido: el contenido se ve desenfocado al pasar por
        // debajo. El borde solo aparece al hacer scroll (scroll-edge effect),
        // en vez de una línea dura permanente.
        bgcolor: (theme) => varAlpha(theme.vars.palette.background.paperChannel, scrolled ? 0.72 : 0.9),
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid",
        borderColor: scrolled ? "divider" : "transparent",
        px: { xs: 1, sm: 2, lg: 3 },
        transition: (theme) =>
          theme.transitions.create(["box-shadow", "background-color", "border-color"], { duration: 300 }),
        boxShadow: scrolled ? (theme) => theme.vars.customShadows.z8 : "none",
        "@media (prefers-reduced-transparency: reduce)": {
          bgcolor: "background.paper",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        },
      }}
    >
      <GlassIconButton
        onClick={toggleMobileNav}
        aria-label={t("menu")}
        size="small"
        sx={{ display: { xs: "inline-flex", md: "none" } }}
      >
        <Iconify icon="eva:menu-2-fill" width={22} />
      </GlassIconButton>

      <Box sx={{ flex: 1 }} />

      <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
        <Stack
          component={motion.button}
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={openPalette}
          whileHover={{ scale: 1.02, transition: SPRING }}
          whileTap={{ scale: 0.97, transition: SPRING_SNAPPY }}
          sx={{
            height: 36,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            px: { xs: 1, md: 1.5 },
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

        <Box sx={{ display: { xs: "none", sm: "block" }, height: 24, width: "1px", flexShrink: 0, bgcolor: "divider" }} />

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
