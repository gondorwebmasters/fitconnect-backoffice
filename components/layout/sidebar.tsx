"use client";

import { Iconify } from "@/components/iconify";
import { Logo } from "@/components/logo";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { varAlpha } from "@/theme/styles";

import { useShell } from "./app-shell";
import { MAIN_NAV, SYSTEM_NAV, type NavItem } from "./nav";
import { useSession } from "./session-provider";

function NavLink({
  item,
  label,
  collapsed,
  variant,
}: {
  item: NavItem;
  label: string;
  collapsed: boolean;
  /** Espacio de nombres del layoutId: el drawer móvil se queda montado (keepMounted)
      en paralelo al aside de escritorio, así que ambos comparten pathname; sin esto
      competirían por el mismo layoutId y Framer Motion dejaría uno de los dos en
      opacity 0. */
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const { href, icon } = item;
  const active =
    href === "/" || href === "/system" ? pathname === href : pathname.startsWith(href);

  return (
    <Stack
      component={Link}
      href={href}
      title={collapsed ? label : undefined}
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        position: "relative",
        borderRadius: 3,
        px: 1.5,
        py: 1,
        fontSize: 14,
        textDecoration: "none",
        transition: (theme) => theme.transitions.create("color", { duration: 200 }),
        ...(collapsed && { justifyContent: "center", px: 0 }),
        ...(active
          ? { fontWeight: 600, color: "primary.contrastText" }
          : { color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } }),
      }}
    >
      {active ? (
        <Box
          component={motion.span}
          layoutId={`sidebar-active-pill-${variant}`}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: 3,
            background: (theme) => `linear-gradient(to right, ${theme.vars.palette.primary.main}, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.85)})`,
            boxShadow: (theme) => `0 4px 6px -1px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.25)}`,
          }}
        />
      ) : null}
      <Iconify icon={icon} width={22} sx={{ position: "relative", flexShrink: 0 }} />
      {!collapsed && (
        <Box component="span" sx={{ position: "relative", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </Box>
      )}
    </Stack>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapsed,
  variant,
}: {
  collapsed: boolean;
  /** Omitido en el drawer móvil: no tiene sentido "colapsar" un overlay. */
  onToggleCollapsed?: () => void;
  variant: "desktop" | "mobile";
}) {
  const { user } = useSession();
  const t = useTranslations("nav.main");
  const tSystem = useTranslations("nav.system");
  const tSidebar = useTranslations("sidebar");

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ py: 3, ...(collapsed ? { justifyContent: "center", px: 0 } : { px: 3 }) }}
      >
        <Box
          component={motion.span}
          whileHover={{ rotate: -8, scale: 1.05 }}
          sx={{ display: "flex", height: 32, width: 32, flexShrink: 0, alignItems: "center", justifyContent: "center" }}
        >
          <Logo disableLink height={32} />
        </Box>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <Stack
              component={motion.span}
              direction="row"
              alignItems="center"
              spacing={1.25}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              sx={{ overflow: "hidden", whiteSpace: "nowrap" }}
            >
              <Typography variant="body2" noWrap sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
                FitConnect
              </Typography>
              <Box
                component="span"
                sx={{
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  px: 0.75,
                  py: 0.25,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "text.disabled",
                }}
              >
                {tSidebar("adminBadge")}
              </Box>
            </Stack>
          )}
        </AnimatePresence>
      </Stack>

      <Stack component="nav" spacing={0.25} sx={{ flex: 1, overflowY: "auto", pb: 2, ...(collapsed ? { px: 1.25 } : { px: 1.5 }) }}>
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} label={t(item.labelKey)} collapsed={collapsed} variant={variant} />
        ))}
        {user?.isSuperAdmin ? (
          <>
            {collapsed ? (
              <Box sx={{ mx: 1, my: 1.5, borderTop: "1px solid", borderColor: "divider" }} />
            ) : (
              <Typography variant="caption" sx={{ px: 1.5, pb: 0.5, pt: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.disabled" }}>
                {tSidebar("system")}
              </Typography>
            )}
            {SYSTEM_NAV.map((item) => (
              <NavLink key={item.href} item={item} label={tSystem(item.labelKey)} collapsed={collapsed} variant={variant} />
            ))}
          </>
        ) : null}
      </Stack>

      {onToggleCollapsed ? (
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", py: 1.5, ...(collapsed ? { px: 1.25 } : { px: 1.5 }) }}>
          <Stack
            component="button"
            direction="row"
            alignItems="center"
            spacing={1.5}
            onClick={onToggleCollapsed}
            title={collapsed ? tSidebar("expand") : tSidebar("collapse")}
            sx={{
              width: "100%",
              borderRadius: 2,
              px: 1.5,
              py: 1,
              fontSize: 14,
              color: "text.disabled",
              transition: (theme) => theme.transitions.create(["background-color", "color"]),
              "&:hover": { bgcolor: "action.hover", color: "text.primary" },
              ...(collapsed && { justifyContent: "center", px: 0 }),
            }}
          >
            {collapsed ? (
              <Iconify icon="solar:double-alt-arrow-right-linear" width={16} />
            ) : (
              <>
                <Iconify icon="solar:double-alt-arrow-left-linear" width={16} />
                <Box component="span">{tSidebar("collapse")}</Box>
              </>
            )}
          </Stack>
        </Box>
      ) : null}
    </>
  );
}

export function Sidebar() {
  const { collapsed, toggleCollapsed, mobileNavOpen, closeMobileNav } = useShell();

  return (
    <>
      {/* Escritorio (md+): columna fija que empuja el contenido, colapsable. */}
      <Box
        component={motion.aside}
        initial={false}
        animate={{ width: collapsed ? 88 : 280 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        sx={{
          display: { xs: "none", md: "flex" },
          position: "fixed",
          inset: "0 auto 0 0",
          zIndex: (theme) => theme.zIndex.drawer,
          flexDirection: "column",
          overflow: "hidden",
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapsed={toggleCollapsed} variant="desktop" />
      </Box>

      {/* Móvil/tablet (< md): drawer temporal sobre el contenido, sin empujar. */}
      <Drawer
        open={mobileNavOpen}
        onClose={closeMobileNav}
        anchor="left"
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: 280, display: "flex", flexDirection: "column" },
        }}
      >
        <SidebarContent collapsed={false} variant="mobile" />
      </Drawer>
    </>
  );
}
