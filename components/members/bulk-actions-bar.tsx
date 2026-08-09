"use client";
import { Iconify } from "@/components/iconify";

import { useMutation } from "@apollo/client";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { User } from "@/lib/graphql/types";
import { DELETE_USER, UPDATE_USER } from "@/lib/graphql/users";

interface BulkActionsBarProps {
  users: User[];
  onClear: () => void;
  onDone: () => void;
}

/**
 * No existe un endpoint de bulk en el backend: cada operación se dispara en
 * paralelo como mutaciones individuales ya existentes (Promise.allSettled)
 * sobre los miembros seleccionados.
 */
export function BulkActionsBar({ users, onClear, onDone }: BulkActionsBarProps) {
  const t = useTranslations("members.bulkActions");
  const toast = useToast();
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);
  const [busy, setBusy] = useState<"block" | "unblock" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const count = users.length;

  const setBlocked = async (isBlocked: boolean) => {
    setBusy(isBlocked ? "block" : "unblock");
    const results = await Promise.allSettled(
      users.map((user) =>
        updateUser({
          variables: {
            user: { id: user.id, email: user.email, nickname: user.nickname, isBlocked },
          },
        }),
      ),
    );
    const failed = results.filter((result) => result.status === "rejected").length;
    setBusy(null);
    toast(
      failed
        ? t("updatedPartial", { updated: count - failed, count, failed })
        : t("updatedSuccess", { count }),
      failed ? "error" : "success",
    );
    onDone();
  };

  const handleDelete = async () => {
    setBusy("delete");
    const results = await Promise.allSettled(users.map((user) => deleteUser({ variables: { id: user.id } })));
    const failed = results.filter((result) => result.status === "rejected").length;
    setBusy(null);
    setConfirmDelete(false);
    toast(
      failed
        ? t("deletedPartial", { updated: count - failed, count, failed })
        : t("deletedSuccess", { count }),
      failed ? "error" : "success",
    );
    onDone();
  };

  return (
    <>
      <Collapse in={count > 0} sx={{ mb: count > 0 ? 2 : 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            borderRadius: 2,
            border: 1,
            borderColor: "primary.main",
            bgcolor: "primary.lighter",
            px: 2,
            py: 1.25,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={onClear} aria-label={t("clearSelection")}>
              <Iconify icon="mingcute:close-line" width={14} />
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("selected", { count })}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="soft"
              color="inherit"
              disabled={busy !== null}
              loading={busy === "unblock"}
              startIcon={<Iconify icon="solar:check-circle-bold" width={14} />}
              onClick={() => setBlocked(false)}
            >
              {t("unblock")}
            </Button>
            <Button
              size="small"
              variant="soft"
              color="inherit"
              disabled={busy !== null}
              loading={busy === "block"}
              startIcon={<Iconify icon="solar:forbidden-circle-bold" width={14} />}
              onClick={() => setBlocked(true)}
            >
              {t("block")}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              disabled={busy !== null}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={14} />}
              onClick={() => setConfirmDelete(true)}
            >
              {t("delete")}
            </Button>
          </Stack>
        </Stack>
      </Collapse>

      <ConfirmDialog
        open={confirmDelete}
        title={t("deleteConfirmTitle", { count })}
        description={t("deleteConfirmDescription")}
        confirmLabel={t("delete")}
        danger
        loading={busy === "delete"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
