"use client";

import { useMutation } from "@apollo/client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/layout/session-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fullName } from "@/lib/format";
import { DELETE_USER } from "@/lib/graphql/users";

export default function DangerSettingsPage() {
  const t = useTranslations("settings.danger");
  const toast = useToast();
  const router = useRouter();
  const { user } = useSession();
  const [confirming, setConfirming] = useState(false);

  const [deleteUser, { loading }] = useMutation(DELETE_USER);

  const handleDelete = async () => {
    if (!user) return;
    try {
      const { data } = await deleteUser({ variables: { id: user.id } });
      if (data?.deleteUser?.success) {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      } else {
        toast(data?.deleteUser?.message ?? t("deleteFailed"), "error");
        setConfirming(false);
      }
    } catch {
      toast(t("deleteFailed"), "error");
      setConfirming(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 672 }}>
      <Card variant="outlined" sx={{ borderColor: "error.main" }}>
        <CardHeader
          title={t("title")}
          subheader={t("subtitle")}
          titleTypographyProps={{ variant: "subtitle1", color: "error.main" }}
          sx={{ borderBottom: 1, borderColor: "error.light" }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ p: 3 }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 400 }}>
            {t("description")}
          </Typography>
          <Button variant="danger" onClick={() => setConfirming(true)} disabled={!user}>
            {t("deleteAccount")}
          </Button>
        </Stack>
      </Card>

      <ConfirmDialog
        open={confirming}
        title={t("confirmTitle")}
        description={t("confirmDescription", { name: user ? fullName(user) : "" })}
        confirmLabel={t("confirmDelete")}
        danger
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </Box>
  );
}
