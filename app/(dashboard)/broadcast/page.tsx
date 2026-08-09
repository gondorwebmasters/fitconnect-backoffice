"use client";
import { Iconify } from "@/components/iconify";

import { useMutation, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { MemberFilters } from "@/components/members/member-filters";
import { Avatar } from "@/components/ui/avatar";
import { BadgeDot } from "@/components/ui/badge-dot";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dropdown } from "@/components/ui/dropdown";
import { Field, Textarea, Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/sticky-header";
import { useToast } from "@/components/ui/toast";
import { fullName } from "@/lib/format";
import { SEND_NOTIFICATION } from "@/lib/graphql/broadcast";
import type { User } from "@/lib/graphql/types";
import { GET_USERS } from "@/lib/graphql/users";

const SERVER_PAGE_SIZE = 50; // ver user.service.ts — no configurable desde el cliente
const PAGE_SIZE = 10;

type NotificationType = "info" | "message" | "warning" | "error";

const TYPE_META: Record<NotificationType, { tone: "positive" | "neutral" | "warning" | "negative"; icon: string }> = {
  info: { tone: "neutral", icon: "solar:info-circle-bold" },
  message: { tone: "positive", icon: "solar:chat-round-bold" },
  warning: { tone: "warning", icon: "solar:danger-triangle-bold" },
  error: { tone: "negative", icon: "solar:close-circle-bold" },
};

// Debe coincidir con las categorías registradas en el cliente Expo vía
// Notifications.setNotificationCategoryAsync (ver client/hooks/notification-categories.ts).
// Agregar una categoría nueva ahí requiere replicar su identificador aquí.
const CATEGORY_IDS = ["NUEVA_RUTINA", "RECORDATORIO_AGUA"] as const;

export default function BroadcastPage() {
  const t = useTranslations("broadcast");
  const toast = useToast();

  const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
    { value: "info", label: t("types.info") },
    { value: "message", label: t("types.message") },
    { value: "warning", label: t("types.warning") },
    { value: "error", label: t("types.error") },
  ];

  const CATEGORY_OPTIONS: { value: string; label: string }[] = CATEGORY_IDS.map((id) => ({
    value: id,
    label: t(`categories.${id}`),
  }));

  const memberState = (user: User): { tone: "positive" | "neutral" | "warning" | "negative" | "muted"; label: string } => {
    if (user.isBlocked) return { tone: "negative", label: t("stateLabels.blocked") };
    if (user.isPending) return { tone: "warning", label: t("stateLabels.pending") };
    if (user.isActive === false) return { tone: "muted", label: t("stateLabels.inactive") };
    return { tone: "positive", label: t("stateLabels.active") };
  };

  // ── Audiencia (mismo patrón de filtros + paginación de Miembros) ──
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [state, setState] = useState("");
  const [serverPage, setServerPage] = useState(0);
  const [subPage, setSubPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(search);
      setServerPage(0);
      setSubPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, loading } = useQuery<{ getUsers: { users: User[] | null } }>(GET_USERS, {
    variables: {
      query: query || undefined,
      page: serverPage,
      roleFilter: role ? [role] : undefined,
      stateFilter: state || undefined,
    },
  });

  const batch = data?.getUsers?.users ?? [];
  const users = batch.slice(subPage * PAGE_SIZE, subPage * PAGE_SIZE + PAGE_SIZE);

  const hasMoreInBatch = (subPage + 1) * PAGE_SIZE < batch.length;
  const hasMoreServerPages = batch.length === SERVER_PAGE_SIZE;
  const canGoNext = hasMoreInBatch || (subPage === Math.floor((batch.length - 1) / PAGE_SIZE) && hasMoreServerPages);
  const canGoPrev = subPage > 0 || serverPage > 0;

  const goNext = () => {
    if (hasMoreInBatch) setSubPage((value) => value + 1);
    else if (hasMoreServerPages) {
      setServerPage((value) => value + 1);
      setSubPage(0);
    }
  };
  const goPrev = () => {
    if (subPage > 0) setSubPage((value) => value - 1);
    else if (serverPage > 0) {
      setServerPage((value) => value - 1);
      setSubPage(Math.floor((SERVER_PAGE_SIZE - 1) / PAGE_SIZE));
    }
  };

  const toggleSelected = (user: User) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(user.id)) next.delete(user.id);
      else next.add(user.id);
      return next;
    });
    setSelectedUsers((current) => {
      const next = new Map(current);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = users.length > 0 && users.every((user) => selectedIds.has(user.id));
    setSelectedIds((current) => {
      const next = new Set(current);
      users.forEach((user) => (allSelected ? next.delete(user.id) : next.add(user.id)));
      return next;
    });
    setSelectedUsers((current) => {
      const next = new Map(current);
      users.forEach((user) => (allSelected ? next.delete(user.id) : next.set(user.id, user)));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectedUsers(new Map());
  };

  // ── Composición del mensaje ──
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [category, setCategory] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [sendNotification, { loading: sending }] = useMutation(SEND_NOTIFICATION);

  const canSend = title.trim().length > 0 && body.trim().length > 0 && selectedIds.size > 0;

  const handleSend = async () => {
    const { data: result } = await sendNotification({
      variables: {
        notification: {
          title: title.trim(),
          body: body.trim(),
          forAll: false,
          userIds: [...selectedIds],
          type,
          categoryIdentifier: category || undefined,
        },
      },
    });

    setConfirmOpen(false);

    if (result?.sendNotification?.success) {
      toast(t("sentToast", { count: selectedIds.size }));
      setTitle("");
      setBody("");
      setCategory("");
      clearSelection();
    } else {
      toast(result?.sendNotification?.message ?? t("sendFailed"), "error");
    }
  };

  const columns: Column<User>[] = [
    {
      key: "member",
      header: t("columns.member"),
      render: (user) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar size="sm" name={fullName(user)} url={user.pictureUrl?.url} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {fullName(user)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              {user.email}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: "state",
      header: t("columns.state"),
      render: (user) => {
        const { tone, label } = memberState(user);
        return <BadgeDot tone={tone} label={label} />;
      },
    },
  ];

  const typeIcon = TYPE_META[type].icon;

  return (
    <PageShell
      header={
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <Iconify icon="solar:bell-bing-bold-duotone" width={16} />
              <Typography variant="subtitle2">{t("composeMessage")}</Typography>
            </Stack>

            <Stack spacing={2.5}>
              <Field label={t("titleField")}>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("titlePlaceholder")}
                  maxLength={80}
                />
              </Field>

              <Field label={t("messageField")}>
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={t("messagePlaceholder")}
                  rows={5}
                  maxLength={400}
                />
              </Field>

              <Field label={t("typeField")}>
                <Dropdown
                  options={TYPE_OPTIONS}
                  value={type}
                  onChange={(value) => setType(value as NotificationType)}
                />
              </Field>

              <Field
                label={t("categoryField")}
                hint={t("categoryHint")}
              >
                <Dropdown
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={setCategory}
                  placeholder={t("categoryPlaceholder")}
                  clearable
                />
              </Field>

              <Box sx={{ borderRadius: 2, bgcolor: "background.neutral", px: 2, py: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ color: "text.secondary", typography: "body2" }}>
                    <Iconify icon={typeIcon} width={14} />
                    {t("selectedRecipients")}
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {selectedIds.size}
                  </Typography>
                </Stack>
                {selectedIds.size > 0 ? (
                  <Link component="button" type="button" onClick={clearSelection} variant="caption" sx={{ mt: 0.5, color: "text.disabled" }}>
                    {t("clearSelection")}
                  </Link>
                ) : (
                  <Typography variant="caption" sx={{ mt: 0.5, color: "text.disabled", display: "block" }}>
                    {t("selectHint")}
                  </Typography>
                )}
              </Box>

              <Button
                variant="primary"
                fullWidth
                disabled={!canSend || sending}
                onClick={() => setConfirmOpen(true)}
              >
                <Iconify icon="solar:plain-2-bold" width={15} />
                {t("send")}
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <MemberFilters
            search={search}
            onSearch={setSearch}
            role={role}
            onRole={(value) => {
              setRole(value);
              setServerPage(0);
              setSubPage(0);
            }}
            state={state}
            onState={(value) => {
              setState(value);
              setServerPage(0);
              setSubPage(0);
            }}
          />

          <DataTable
            columns={columns}
            rows={users}
            rowKey={(user) => user.id}
            loading={loading}
            emptyMessage={t("emptyTable")}
            selection={{ selectedIds, onToggle: toggleSelected, onToggleAll: toggleSelectAll }}
          />

          <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: "text.disabled", fontVariantNumeric: "tabular-nums" }}>
              {t("pageLabel", { page: serverPage * (SERVER_PAGE_SIZE / PAGE_SIZE) + subPage + 1 })}
            </Typography>
            <Button size="sm" variant="ghost" disabled={!canGoPrev} onClick={goPrev}>
              {t("previous")}
            </Button>
            <Button size="sm" variant="ghost" disabled={!canGoNext} onClick={goNext}>
              {t("next")}
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmOpen}
        title={t("confirmTitle")}
        description={t("confirmDescription", {
          title,
          count: selectedIds.size,
          names: [...selectedUsers.values()].slice(0, 3).map(fullName).join(", "),
          more: selectedUsers.size > 3 ? t("confirmMore", { count: selectedUsers.size - 3 }) : "",
        })}
        confirmLabel={sending ? t("sending") : t("confirmSend")}
        loading={sending}
        onConfirm={handleSend}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageShell>
  );
}
