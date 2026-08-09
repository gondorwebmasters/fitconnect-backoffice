"use client";

import { Iconify } from "@/components/iconify";

import { useMutation } from "@apollo/client";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { UPDATE_PASSWORD } from "@/lib/graphql/auth";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordInput({
  label,
  hint,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete: string;
}) {
  const t = useTranslations("profile.passwordForm");
  const [visible, setVisible] = useState(false);
  return (
    <Input
      label={label}
      helperText={hint}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      minLength={6}
      required
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? t("hidePassword") : t("showPassword")}
                edge="end"
              >
                {visible ? <Iconify icon="solar:eye-closed-bold" width={15} /> : <Iconify icon="solar:eye-bold" width={15} />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function PasswordForm() {
  const t = useTranslations("profile.passwordForm");
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [updatePassword, { loading }] = useMutation(UPDATE_PASSWORD);

  const set = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const mismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mismatch) return;
    try {
      const { data } = await updatePassword({ variables: { password: form } });
      if (data?.updatePassword?.success) {
        toast(t("updated"));
        setForm(EMPTY);
      } else {
        toast(data?.updatePassword?.message ?? t("updateFailed"), "error");
      }
    } catch {
      toast(t("updateFailed"), "error");
    }
  };

  return (
    <Card variant="outlined">
      <CardHeader title={t("title")} subheader={t("subtitle")} titleTypographyProps={{ variant: "subtitle1" }} />

      <Stack component="form" onSubmit={handleSubmit} spacing={2.5} sx={{ p: 3 }}>
        <PasswordInput
          label={t("currentPassword")}
          value={form.currentPassword}
          onChange={set("currentPassword")}
          autoComplete="current-password"
        />
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PasswordInput
              label={t("newPassword")}
              hint={t("newPasswordHint")}
              value={form.newPassword}
              onChange={set("newPassword")}
              autoComplete="new-password"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PasswordInput
              label={t("confirmPassword")}
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              autoComplete="new-password"
            />
          </Grid>
        </Grid>
        {mismatch ? (
          <Typography role="alert" variant="caption" sx={{ color: "error.main" }}>
            {t("mismatch")}
          </Typography>
        ) : null}

        <Stack direction="row" justifyContent="flex-end" sx={{ pt: 0.5 }}>
          <Button type="submit" variant="primary" disabled={loading || mismatch}>
            {loading ? t("updating") : t("changePassword")}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
