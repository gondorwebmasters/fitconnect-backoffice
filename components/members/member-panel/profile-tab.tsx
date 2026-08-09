"use client";

import { Iconify } from "@/components/iconify";

import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z as zod } from "zod";

import { useSession } from "@/components/layout/session-provider";
import { Form, Field } from "@/components/hook-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ADMIN_UPDATE_PASSWORD } from "@/lib/graphql/auth";
import type { User } from "@/lib/graphql/types";
import { ADMIT_USER_TO_COMPANY, DELETE_USER, UPDATE_USER } from "@/lib/graphql/users";

import { useRoleOptions } from "../member-filters";

const EMPTY_PASSWORD_FORM = { newPassword: "", confirmPassword: "" };

const ProfileSchema = zod.object({
  name: zod.string(),
  surname: zod.string(),
  email: zod.string().min(1).email(),
  nickname: zod.string().min(1),
  phoneNumber: zod.string(),
  role: zod.enum(["standard", "coach", "admin"]),
  isActive: zod.boolean(),
  isBlocked: zod.boolean(),
});

type ProfileValues = zod.infer<typeof ProfileSchema>;

function toForm(member: User): ProfileValues {
  return {
    name: member.name ?? "",
    surname: member.surname ?? "",
    email: member.email,
    nickname: member.nickname,
    phoneNumber: member.phoneNumber ?? "",
    role: (member.contextRole ?? "standard") as ProfileValues["role"],
    isActive: member.isActive !== false,
    isBlocked: Boolean(member.isBlocked),
  };
}

function PasswordField({
  label,
  helperText,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  helperText?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete: string;
}) {
  const t = useTranslations("members.profileTab");
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      type={visible ? "text" : "password"}
      label={label}
      helperText={helperText}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      fullWidth
      slotProps={{
        htmlInput: { minLength: 6 },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? t("hidePassword") : t("showPassword")}
                edge="end"
                size="small"
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

interface ProfileTabProps {
  member: User;
  onChanged: () => void;
  onDeleted: () => void;
}

export function ProfileTab({ member, onChanged, onDeleted }: ProfileTabProps) {
  const t = useTranslations("members.profileTab");
  const tCommon = useTranslations("members.bulkActions");
  const toast = useToast();
  const { user: sessionUser } = useSession();
  const roleOptions = useRoleOptions();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: toForm(member),
  });
  const { handleSubmit, reset, watch } = methods;

  useEffect(() => {
    reset(toForm(member));
  }, [member, reset]);

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);

  const [updateUser, { loading: saving }] = useMutation(UPDATE_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER);
  const [admitUser, { loading: admitting }] = useMutation(ADMIT_USER_TO_COMPANY);
  const [adminUpdatePassword, { loading: changingPassword }] = useMutation(ADMIN_UPDATE_PASSWORD);

  const onSubmit = handleSubmit(async (values) => {
    const { data } = await updateUser({
      variables: {
        user: {
          id: member.id,
          name: values.name || undefined,
          surname: values.surname || undefined,
          email: values.email,
          nickname: values.nickname,
          phoneNumber: values.phoneNumber || undefined,
          role: values.role,
          isActive: values.isActive,
          isBlocked: values.isBlocked,
        },
      },
    });
    const result = data?.updateUser;
    if (result?.success) {
      toast(t("profileUpdated"));
      onChanged();
    } else {
      toast(result?.message ?? t("saveFailed"), "error");
    }
  });

  const handleAdmit = async () => {
    if (!sessionUser?.activeCompanyId) return;
    const { data } = await admitUser({
      variables: { companyId: sessionUser.activeCompanyId, userId: member.id, role: watch("role") },
    });
    const result = data?.admitUserToCompany;
    if (result?.success) {
      toast(t("admittedSuccess"));
      onChanged();
    } else {
      toast(result?.message ?? t("admitFailed"), "error");
    }
  };

  const passwordMismatch =
    passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword;

  const handleChangePassword = async () => {
    if (passwordMismatch || passwordForm.newPassword.length < 6) return;
    try {
      const { data } = await adminUpdatePassword({
        variables: { password: { userId: member.id, ...passwordForm } },
      });
      const result = data?.adminUpdatePassword;
      if (result?.success) {
        toast(t("passwordUpdated"));
        setPasswordForm(EMPTY_PASSWORD_FORM);
      } else {
        toast(result?.message ?? t("passwordUpdateFailed"), "error");
      }
    } catch {
      toast(t("passwordUpdateFailed"), "error");
    }
  };

  const handleDelete = async () => {
    const { data } = await deleteUser({ variables: { id: member.id } });
    const result = data?.deleteUser;
    if (result?.success) {
      toast(t("memberDeleted"));
      onDeleted();
    } else {
      toast(result?.message ?? t("deleteFailed"), "error");
      setConfirmDelete(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      {member.isPending ? (
        <Alert
          severity="warning"
          action={
            <Button size="small" variant="contained" onClick={handleAdmit} loading={admitting}>
              {t("admit")}
            </Button>
          }
        >
          {t("pendingAdmission")}
        </Alert>
      ) : null}

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <Field.Text name="name" label={t("name")} />
            </Grid>
            <Grid size={6}>
              <Field.Text name="surname" label={t("surname")} />
            </Grid>
          </Grid>

          <Field.Text name="email" type="email" label={t("email")} />

          <Grid container spacing={2}>
            <Grid size={6}>
              <Field.Text name="nickname" label={t("username")} />
            </Grid>
            <Grid size={6}>
              <Field.Phone name="phoneNumber" label={t("phone")} />
            </Grid>
          </Grid>

          <Field.Text name="role" label={t("role")} select>
            {roleOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Text>

          <Stack spacing={0.5}>
            <Field.Checkbox name="isActive" label={t("activeMember")} />
            <Field.Checkbox name="isBlocked" label={t("blockAccess")} />
          </Stack>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Button color="error" size="small" onClick={() => setConfirmDelete(true)}>
              {t("deleteMember")}
            </Button>
            <Button type="submit" variant="contained" loading={saving}>
              {t("saveChanges")}
            </Button>
          </Stack>
        </Stack>
      </Form>

      {sessionUser?.isSuperAdmin ? (
        <>
          <Divider />
          <Box>
            <Typography variant="subtitle2">{t("passwordSectionTitle")}</Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              {t("passwordSectionHint")}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <PasswordField
                label={t("newPassword")}
                helperText={t("newPasswordHint")}
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                autoComplete="new-password"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <PasswordField
                label={t("confirmPassword")}
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                autoComplete="new-password"
              />
            </Grid>
          </Grid>
          {passwordMismatch ? (
            <Typography role="alert" variant="caption" sx={{ color: "error.main" }}>
              {t("passwordMismatch")}
            </Typography>
          ) : null}
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="soft"
              onClick={handleChangePassword}
              loading={changingPassword}
              disabled={passwordMismatch || passwordForm.newPassword.length < 6}
            >
              {t("changePassword")}
            </Button>
          </Stack>
        </>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { name: member.nickname })}
        confirmLabel={tCommon("delete")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Stack>
  );
}
