"use client";

import { Iconify } from "@/components/iconify";

import { useMutation, useQuery } from "@apollo/client";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Label, type LabelColor } from "@/components/label";
import { StatusChip, type StatusTone } from "@/components/mui/status-chip";
import { TableHeadCustom, TableNoData } from "@/components/table";
import { BulkActionsBar } from "@/components/members/bulk-actions-bar";
import { CreateMemberForm } from "@/components/members/create-member-form";
import { MemberFilters, useStateOptions } from "@/components/members/member-filters";
import { MemberPanel } from "@/components/members/member-panel";
import { Menu, MenuItem } from "@/components/ui/menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fullName } from "@/lib/format";
import { GET_ADMIN_STATS } from "@/lib/graphql/stats";
import { DELETE_USER, UPDATE_USER } from "@/lib/graphql/users";
import type { AdminStats, User } from "@/lib/graphql/types";
import { GET_USERS } from "@/lib/graphql/users";

const SERVER_PAGE_SIZE = 50; // ver user.service.ts — no configurable desde el cliente
const PAGE_SIZE = 10; // tamaño de página mostrado en la tabla

function useMemberState() {
  const t = useTranslations("members.page.stateLabels");
  return (user: User): { tone: StatusTone; label: string } => {
    if (user.isBlocked) return { tone: "negative", label: t("blocked") };
    if (user.isPending) return { tone: "warning", label: t("pending") };
    if (user.isActive === false) return { tone: "muted", label: t("inactive") };
    return { tone: "positive", label: t("active") };
  };
}

function RowActions({ user, onChanged }: { user: User; onChanged: () => void }) {
  const t = useTranslations("members.bulkActions");
  const tPage = useTranslations("members.page");
  const toast = useToast();
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setBlocked = async (isBlocked: boolean) => {
    const { data } = await updateUser({
      variables: { user: { id: user.id, email: user.email, nickname: user.nickname, isBlocked } },
    });
    if (data?.updateUser?.success) {
      toast(t("updatedSuccess", { count: 1 }));
      onChanged();
    } else {
      toast(data?.updateUser?.message ?? t("updatedPartial", { updated: 0, count: 1, failed: 1 }), "error");
    }
  };

  const handleDelete = async () => {
    const { data } = await deleteUser({ variables: { id: user.id } });
    setConfirmDelete(false);
    if (data?.deleteUser?.success) {
      toast(t("deletedSuccess", { count: 1 }));
      onChanged();
    } else {
      toast(data?.deleteUser?.message ?? t("deletedPartial", { updated: 0, count: 1, failed: 1 }), "error");
    }
  };

  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} onClick={(event) => event.stopPropagation()}>
      <Menu
        align="end"
        trigger={() => (
          <IconButton size="small" aria-label={tPage("moreActions")} disabled={updating || deleting}>
            <Iconify icon="eva:more-vertical-fill" width={18} />
          </IconButton>
        )}
      >
        <MenuItem icon={<Iconify icon="solar:check-circle-bold" width={18} />} onClick={() => setBlocked(false)}>
          {t("unblock")}
        </MenuItem>
        <MenuItem icon={<Iconify icon="solar:forbidden-circle-bold" width={18} />} onClick={() => setBlocked(true)}>
          {t("block")}
        </MenuItem>
        <MenuItem icon={<Iconify icon="solar:trash-bin-trash-bold" width={18} />} tone="danger" onClick={() => setConfirmDelete(true)}>
          {t("delete")}
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={confirmDelete}
        title={t("deleteConfirmTitle", { count: 1 })}
        description={t("deleteConfirmDescription")}
        confirmLabel={t("delete")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Stack>
  );
}

function MembersContent() {
  const t = useTranslations("members.page");
  const memberState = useMemberState();
  const roleLabels = useTranslations("members.page.roleLabels");
  const stateOptions = useStateOptions();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState("");
  const [state, setState] = useState(searchParams.get("state") ?? "");
  const [dense, setDense] = useState(false);
  // La API solo pagina en bloques de 50 (SERVER_PAGE_SIZE); subPage divide
  // cada bloque ya cargado en páginas de 10 sin peticiones extra de red.
  const [serverPage, setServerPage] = useState(0);
  const [subPage, setSubPage] = useState(0);
  const [selected, setSelected] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(search);
      setServerPage(0);
      setSubPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Navegación desde el CommandPalette estando ya en /members
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const { data, loading, refetch } = useQuery<{ getUsers: { users: User[] | null } }>(GET_USERS, {
    variables: {
      query: query || undefined,
      page: serverPage,
      roleFilter: role ? [role] : undefined,
      stateFilter: state || undefined,
    },
  });

  const { data: statsData } = useQuery<{ getAdminStats: { stats: AdminStats | null } }>(GET_ADMIN_STATS);
  const userStats = statsData?.getAdminStats?.stats?.users;
  const STATE_STAT_COUNT: Record<string, number | undefined> = {
    new: userStats?.newUsers,
    pending: userStats?.pendingUsers,
    blocked: userStats?.blockedUsers,
    inactive: userStats?.notActiveUsers,
  };
  const STATE_TONE: Record<string, LabelColor> = {
    new: "success",
    pending: "warning",
    blocked: "error",
    inactive: "default",
    notVerified: "default",
  };

  const batch = data?.getUsers?.users ?? [];
  const users = batch.slice(subPage * PAGE_SIZE, subPage * PAGE_SIZE + PAGE_SIZE);
  const selectedUsers = users.filter((user) => selectedIds.has(user.id));

  const hasMoreInBatch = (subPage + 1) * PAGE_SIZE < batch.length;
  const hasMoreServerPages = batch.length === SERVER_PAGE_SIZE;
  const canGoNext = hasMoreInBatch || (subPage === Math.floor((batch.length - 1) / PAGE_SIZE) && hasMoreServerPages);
  const canGoPrev = subPage > 0 || serverPage > 0;

  const goNext = () => {
    if (hasMoreInBatch) {
      setSubPage((value) => value + 1);
    } else if (hasMoreServerPages) {
      setServerPage((value) => value + 1);
      setSubPage(0);
    }
  };

  const goPrev = () => {
    if (subPage > 0) {
      setSubPage((value) => value - 1);
    } else if (serverPage > 0) {
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
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(users.map((user) => user.id)) : new Set());
  };

  const setStateFilter = (value: string) => {
    setState(value);
    setServerPage(0);
    setSubPage(0);
  };

  const headLabel = [
    { id: "member", label: t("columns.member") },
    { id: "role", label: t("columns.role") },
    { id: "phone", label: t("columns.phone") },
    { id: "state", label: t("columns.state") },
    { id: "actions", label: "", align: "right" as const },
  ];

  const numSelected = users.filter((user) => selectedIds.has(user.id)).length;

  return (
    <>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h4">{t("title")}</Typography>
          <Box sx={{ mt: 1 }}>
            <Breadcrumbs />
          </Box>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.disabled" }}>
            {t("subtitle")}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" width={18} />} onClick={() => setCreating(true)}>
          {t("newMember")}
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ mt: 3 }}>
        <Tabs
          value={state}
          onChange={(_event, value: string) => setStateFilter(value)}
          sx={{ px: 2.5, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab
            value=""
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <span>{t("allTab")}</span>
                {userStats ? <Label color="default">{userStats.totalUsers}</Label> : null}
              </Stack>
            }
          />
          {stateOptions.map((option) => {
            const count = STATE_STAT_COUNT[option.value];
            return (
              <Tab
                key={option.value}
                value={option.value}
                label={
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <span>{option.label}</span>
                    {count !== undefined ? (
                      <Label color={STATE_TONE[option.value] ?? "default"}>
                        {count}
                      </Label>
                    ) : null}
                  </Stack>
                }
              />
            );
          })}
        </Tabs>

        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <MemberFilters search={search} onSearch={setSearch} role={role} onRole={(value) => { setRole(value); setServerPage(0); setSubPage(0); }} />
        </Box>

        <Box sx={{ px: 2.5 }}>
          <BulkActionsBar
            users={selectedUsers}
            onClear={() => setSelectedIds(new Set())}
            onDone={() => {
              setSelectedIds(new Set());
              refetch();
            }}
          />
        </Box>

        <TableContainer>
          <Table size={dense ? "small" : "medium"}>
            <TableHeadCustom
              headLabel={headLabel}
              rowCount={users.length}
              numSelected={numSelected}
              onSelectAllRows={toggleSelectAll}
            />
            <TableBody>
              {loading && users.length === 0
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell padding="checkbox">
                        <Skeleton variant="rounded" width={20} height={20} />
                      </TableCell>
                      {headLabel.map((column) => (
                        <TableCell key={column.id}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : users.map((user) => {
                    const rowSelected = selectedIds.has(user.id);
                    const { tone, label } = memberState(user);
                    return (
                      <TableRow
                        key={user.id}
                        hover
                        selected={rowSelected}
                        onClick={() => setSelected(user)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                          <Checkbox checked={rowSelected} onChange={() => toggleSelected(user)} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar src={user.pictureUrl?.url ?? undefined} sx={{ width: dense ? 28 : 36, height: dense ? 28 : 36 }}>
                              {fullName(user).charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {fullName(user)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                                {user.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {["standard", "coach", "admin"].includes(user.contextRole ?? "")
                            ? roleLabels(user.contextRole as "standard" | "coach" | "admin")
                            : "—"}
                        </TableCell>
                        <TableCell>{user.phoneNumber ?? "—"}</TableCell>
                        <TableCell>
                          <StatusChip tone={tone} label={label} />
                        </TableCell>
                        <TableCell align="right">
                          <RowActions user={user} onChanged={refetch} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              {!loading && users.length === 0 ? <TableNoData notFound message={t("emptyTable")} /> : null}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.5 }}>
          <FormControlLabel
            control={<Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />}
            label={t("dense")}
            slotProps={{ typography: { variant: "body2", color: "text.secondary" } }}
          />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" sx={{ color: "text.disabled", fontVariantNumeric: "tabular-nums" }}>
              {t("pageLabel", { page: serverPage * (SERVER_PAGE_SIZE / PAGE_SIZE) + subPage + 1 })}
            </Typography>
            <IconButton size="small" disabled={!canGoPrev} onClick={goPrev}>
              <Iconify icon="eva:arrow-ios-back-fill" width={18} />
            </IconButton>
            <IconButton size="small" disabled={!canGoNext} onClick={goNext}>
              <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      <MemberPanel member={selected} onClose={() => setSelected(null)} onChanged={() => refetch()} />
      <CreateMemberForm open={creating} onClose={() => setCreating(false)} onCreated={() => refetch()} />
    </>
  );
}

export default function MembersPage() {
  return (
    <Suspense>
      <MembersContent />
    </Suspense>
  );
}
