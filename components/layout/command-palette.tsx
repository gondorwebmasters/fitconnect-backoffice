"use client";

import { Iconify } from "@/components/iconify";

import { useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { varAlpha } from "@/theme/styles";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { fullName } from "@/lib/format";
import { GET_USERS } from "@/lib/graphql/users";
import type { User } from "@/lib/graphql/types";

import { MAIN_NAV, SYSTEM_NAV } from "./nav";
import { useSession } from "./session-provider";

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
}

type UsersData = {
  getUsers: { success: boolean; users: User[] | null } | null;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user } = useSession();
  const t = useTranslations("commandPalette");
  const tMain = useTranslations("nav.main");
  const tSystem = useTranslations("nav.system");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebounced("");
      setHighlighted(0);
      // el input se monta en este mismo render
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: usersData, loading: loadingUsers } = useQuery<UsersData>(GET_USERS, {
    variables: { query: debounced, page: 0 },
    skip: !open || debounced.length < 2,
    fetchPolicy: "cache-and-network",
  });

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const nav = [
      ...MAIN_NAV.map((item) => ({ ...item, label: tMain(item.labelKey) })),
      ...(user?.isSuperAdmin ? SYSTEM_NAV.map((item) => ({ ...item, label: tSystem(item.labelKey) })) : []),
    ]
      .filter((item) => !q || item.label.toLowerCase().includes(q))
      .map<PaletteItem>((item) => ({
        id: `nav-${item.href}`,
        group: t("groupNavigation"),
        label: item.label,
        icon: <Iconify icon={item.icon} width={15} />,
        action: () => router.push(item.href),
      }));

    const members = (usersData?.getUsers?.users ?? []).slice(0, 6).map<PaletteItem>((member) => ({
      id: `user-${member.id}`,
      group: t("groupMembers"),
      label: fullName(member),
      description: member.email ?? undefined,
      icon: <Iconify icon="solar:user-rounded-bold" width={15} />,
      action: () => router.push(`/members?q=${encodeURIComponent(member.email ?? fullName(member))}`),
    }));

    return [...nav, ...(debounced.length >= 2 ? members : [])];
  }, [query, debounced, usersData, user?.isSuperAdmin, router, t, tMain, tSystem]);

  useEffect(() => {
    setHighlighted(0);
  }, [items.length, open]);

  const run = (item: PaletteItem) => {
    onClose();
    item.action();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowDown") {
      setHighlighted((index) => Math.min(index + 1, items.length - 1));
      event.preventDefault();
    } else if (event.key === "ArrowUp") {
      setHighlighted((index) => Math.max(index - 1, 0));
      event.preventDefault();
    } else if (event.key === "Enter") {
      const item = items[highlighted];
      if (item) run(item);
      event.preventDefault();
    }
  };

  let lastGroup: string | null = null;

  return (
    <AnimatePresence>
      {open ? (
        <Box sx={{ position: "fixed", inset: 0, zIndex: (theme) => theme.zIndex.modal, display: "flex", alignItems: "flex-start", justifyContent: "center", px: 2, pt: "15vh" }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            sx={{ position: "absolute", inset: 0, bgcolor: (theme) => varAlpha(theme.vars.palette.grey["900Channel"], 0.3), backdropFilter: "blur(4px)" }}
          />
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 512,
              overflow: "hidden",
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: (theme) => theme.vars.customShadows.dialog,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2 }}>
              <Iconify icon="eva:search-fill" width={15} sx={{ flexShrink: 0, color: "text.disabled" }} />
              <InputBase
                inputRef={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("placeholder")}
                sx={{ height: 48, width: "100%", fontSize: 14 }}
              />
            </Stack>
            <Box component="ul" sx={{ maxHeight: 320, overflowY: "auto", listStyle: "none", m: 0, py: 0.75 }}>
              {items.map((item, index) => {
                const showGroup = item.group !== lastGroup;
                lastGroup = item.group;
                const isHighlighted = index === highlighted;
                return (
                  <li key={item.id}>
                    {showGroup ? (
                      <Typography variant="caption" sx={{ px: 2, pb: 0.5, pt: 1.5, display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.disabled" }}>
                        {item.group}
                      </Typography>
                    ) : null}
                    <Stack
                      component="button"
                      onClick={() => run(item)}
                      onMouseEnter={() => setHighlighted(index)}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        width: "100%",
                        px: 2,
                        py: 1,
                        textAlign: "left",
                        fontSize: 14,
                        transition: (theme) => theme.transitions.create(["background-color", "color"]),
                        ...(isHighlighted
                          ? { bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.1), color: "primary.main" }
                          : { color: "text.secondary" }),
                      }}
                    >
                      <Box component="span" sx={{ color: isHighlighted ? "primary.main" : "text.disabled" }}>
                        {item.icon}
                      </Box>
                      <Box component="span" sx={{ minWidth: 0, flex: 1 }}>
                        <Box component="span" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.label}
                        </Box>
                        {item.description ? (
                          <Box
                            component="span"
                            sx={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: 12,
                              color: isHighlighted ? (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.7) : "text.disabled",
                            }}
                          >
                            {item.description}
                          </Box>
                        ) : null}
                      </Box>
                      {isHighlighted ? (
                        <Iconify icon="solar:reply-bold" width={13} sx={{ flexShrink: 0, opacity: 0.6 }} />
                      ) : null}
                    </Stack>
                  </li>
                );
              })}
              {items.length === 0 ? (
                <Typography component="li" variant="caption" sx={{ display: "block", px: 2, py: 5, textAlign: "center", color: "text.disabled" }}>
                  {loadingUsers ? t("searching") : t("noResults")}
                </Typography>
              ) : null}
            </Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ borderTop: "1px solid", borderColor: "divider", px: 2, py: 1, fontSize: 10, color: "text.disabled" }}>
              <Box component="span">↑↓ {t("navigate")}</Box>
              <Box component="span">↵ {t("open")}</Box>
              <Box component="span">esc {t("close")}</Box>
            </Stack>
          </Box>
        </Box>
      ) : null}
    </AnimatePresence>
  );
}
