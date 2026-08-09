"use client";

import Box from "@mui/material/Box";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { CommandPalette } from "./command-palette";
import { CompanyBackdrop } from "./company-backdrop";
import { useSession } from "./session-provider";
import { SessionSplash } from "./session-splash";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const SIDEBAR_STORAGE_KEY = "fc-bo-sidebar";

interface ShellContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  openPalette: () => void;
}

const ShellContext = createContext<ShellContextValue>({
  collapsed: false,
  toggleCollapsed: () => {},
  openPalette: () => {},
});

export function useShell() {
  return useContext(ShellContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  // Arranca expandido para no romper la hidratación; el valor guardado
  // se aplica tras montar.
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useSession();

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1");
    } catch {
      // sin localStorage seguimos con el valor por defecto
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? "0" : "1");
      } catch {
        // ignorable
      }
      return !value;
    });
  }, []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  // Atajo global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ShellContext.Provider value={{ collapsed, toggleCollapsed, openPalette }}>
      <SessionSplash />
      <CompanyBackdrop />
      <Sidebar />
      <Box
        sx={{
          position: "relative",
          transition: (theme) => theme.transitions.create("padding-left", { duration: 200 }),
          pl: collapsed ? "88px" : "280px",
        }}
      >
        <Topbar />
        <Box component="main" sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2.5, lg: 5 }, py: 4 }}>
          {/*
            Solo opacity, nunca x/y/scale: cualquier motion value de
            transform (incluido "y") hace que framer-motion fije un
            `transform` inline en este div, y eso convierte a CUALQUIER
            descendiente `position: fixed` (SlideOver, ConfirmDialog…) en
            relativo a este contenedor en vez de al viewport — se ven
            "pantallazos" de esos paneles mal posicionados. Con opacity a
            secas framer-motion nunca toca `transform`, así que los overlays
            fixed de cada página quedan intactos.
          */}
          <motion.div
            // También se incluye activeCompanyId: cambiar de empresa no cambia la ruta,
            // así que sin esto las páginas conservan filtros/selecciones (planId, búsquedas...)
            // de la empresa anterior y las listas no se refrescan tras el resetStore().
            key={`${pathname}-${user?.activeCompanyId ?? ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </Box>
      </Box>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </ShellContext.Provider>
  );
}
