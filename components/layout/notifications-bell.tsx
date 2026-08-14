"use client";

import { Iconify } from "@/components/iconify";

import { useQuery } from "@apollo/client";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Label } from "@/components/label";
import { Popover } from "@/components/ui/popover";
import { varAlpha } from "@/theme/styles";
import { GET_NOTIFICATIONS } from "@/lib/graphql/notifications";
import { GET_ACTIVE_COMPANY_LOGO } from "@/lib/graphql/companies";

import { useSession } from "./session-provider";

interface Notification {
  id: string;
  created_at: string;
  type: string;
  message: string;
  link: string;
}

type NotificationsData = {
  getNotifications: { success: boolean; notifications: Notification[] | null } | null;
};

const TYPE_ICON: Record<string, { icon: string; color: "info" | "success" | "warning" | "error" }> = {
  info: { icon: "solar:info-circle-bold", color: "info" },
  message: { icon: "solar:chat-round-bold", color: "success" },
  warning: { icon: "solar:danger-triangle-bold", color: "warning" },
  error: { icon: "solar:close-circle-bold", color: "error" },
};

function typeMeta(type: string) {
  return TYPE_ICON[type] ?? TYPE_ICON.info;
}

function typeLabel(type: string, t: (key: string, values?: Record<string, number>) => string): string {
  const key = type in TYPE_ICON ? type : "info";
  return t(`types.${key}`);
}

function timeAgo(value: string, t: (key: string, values?: Record<string, number>) => string): string {
  const date = new Date(Number.isNaN(Number(value)) ? value : Number(value));
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return "";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t("now");
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("daysAgo", { count: days });
}

// El backend no expone estado leído/no leído — se lleva localmente por
// pestaña de forma que "marcar todo como leído" y el contador sean reales,
// en vez de simular un estado que no existe.
const READ_STORAGE_KEY = "fc-bo-notifications-read";

function readStoredIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

type CompanyLogoData = {
  getCompanies: {
    success: boolean;
    company: { id: string; name: string; logo?: { url: string } | null } | null;
  } | null;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const t = useTranslations("notificationsBell");
  const { user } = useSession();
  const { data, loading } = useQuery<NotificationsData>(GET_NOTIFICATIONS, {
    fetchPolicy: "cache-and-network",
    pollInterval: 120_000,
  });
  // Las notificaciones las envía el gimnasio (no hay remitente individual en
  // el backend), así que el avatar que se muestra es el del propio gimnasio.
  const { data: companyData } = useQuery<CompanyLogoData>(GET_ACTIVE_COMPANY_LOGO, {
    variables: { companyId: user?.activeCompanyId },
    skip: !user?.activeCompanyId,
  });
  const company = companyData?.getCompanies?.company;

  useEffect(() => {
    setReadIds(readStoredIds());
  }, []);

  const persistRead = (next: Set<string>) => {
    setReadIds(next);
    try {
      window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // sin localStorage el estado de leído no persiste entre recargas
    }
  };

  const notifications = data?.getNotifications?.notifications ?? [];
  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length;
  const visible = tab === "unread" ? notifications.filter((notification) => !readIds.has(notification.id)) : notifications;

  const markAllRead = () => persistRead(new Set(notifications.map((notification) => notification.id)));
  const markRead = (id: string) => {
    if (readIds.has(id)) return;
    persistRead(new Set(readIds).add(id));
  };

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      panelSx={{ width: 400 }}
      trigger={
        <IconButton
          onClick={() => setOpen((value) => !value)}
          aria-label={unreadCount ? t("titleWithCount", { count: unreadCount }) : t("title")}
          size="small"
          sx={{ position: "relative", color: "text.disabled" }}
        >
          <Iconify icon="solar:bell-bold" width={22} />
          {unreadCount > 0 ? (
            <Box
              component="span"
              sx={{
                position: "absolute",
                right: 6,
                top: 6,
                display: "flex",
                height: 15,
                minWidth: 15,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                bgcolor: "error.main",
                px: 0.25,
                fontSize: 9,
                fontWeight: 700,
                lineHeight: 1,
                color: "error.contrastText",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Box>
          ) : null}
        </IconButton>
      }
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pl: 2.5, pr: 1.5, py: 2 }}>
        <Typography variant="h6">{t("title")}</Typography>
        <Tooltip title={t("markAllRead")}>
          <span>
            <IconButton size="small" disabled={unreadCount === 0} onClick={markAllRead} sx={{ color: "success.main" }}>
              <Iconify icon="eva:done-all-fill" width={20} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Tabs value={tab} onChange={(_event, value: "all" | "unread") => setTab(value)} sx={{ px: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Tab
          value="all"
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <span>{t("all")}</span>
              <Label color="default">{notifications.length}</Label>
            </Stack>
          }
        />
        <Tab
          value="unread"
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <span>{t("unread")}</span>
              <Label color="info">{unreadCount}</Label>
            </Stack>
          }
        />
      </Tabs>

      <Box component="ul" sx={{ maxHeight: 440, overflowY: "auto", listStyle: "none", m: 0, p: 0 }}>
        {visible.slice(0, 20).map((notification, index) => {
          const meta = typeMeta(notification.type);
          const unread = !readIds.has(notification.id);
          return (
            <Box component="li" key={notification.id}>
              {index > 0 ? <Divider component="div" /> : null}
              <Stack
                component="button"
                type="button"
                onClick={() => markRead(notification.id)}
                direction="row"
                alignItems="flex-start"
                spacing={1.5}
                sx={{
                  width: "100%",
                  textAlign: "left",
                  px: 2.5,
                  py: 1.75,
                  bgcolor: unread ? (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08) : "transparent",
                  transition: (theme) => theme.transitions.create("background-color"),
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 18,
                        width: 18,
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: "background.paper",
                        bgcolor: `${meta.color}.lighter`,
                        color: `${meta.color}.dark`,
                      }}
                    >
                      <Iconify icon={meta.icon} width={11} />
                    </Box>
                  }
                  sx={{ flexShrink: 0 }}
                >
                  <Avatar src={company?.logo?.url} sx={{ height: 40, width: 40 }}>
                    {company?.name?.charAt(0)}
                  </Avatar>
                </Badge>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: "text.primary" }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "text.disabled" }}>
                    {timeAgo(notification.created_at, t)} · {typeLabel(notification.type, t)}
                  </Typography>
                </Box>
                {unread ? (
                  <Box sx={{ mt: 0.75, height: 8, width: 8, flexShrink: 0, borderRadius: "50%", bgcolor: "info.main" }} />
                ) : null}
              </Stack>
            </Box>
          );
        })}
        {visible.length === 0 ? (
          <Typography component="li" variant="body2" sx={{ display: "block", px: 2.5, py: 6, textAlign: "center", color: "text.disabled" }}>
            {loading ? t("loading") : t("empty")}
          </Typography>
        ) : null}
      </Box>
    </Popover>
  );
}
