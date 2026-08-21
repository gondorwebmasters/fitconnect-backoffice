"use client";
import { Iconify } from "@/components/iconify";

import { useMutation } from "@apollo/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/components/ui/toast";
import { CREATE_COMPANY_MEMBER } from "@/lib/graphql/users";

import { useRoleOptions } from "./member-filters";

const EMPTY_FORM = { email: "", nickname: "", password: "", role: "standard", isActive: true };
const EMPTY_FIELD_ERRORS = { email: "", nickname: "" };

interface CreateMemberFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateMemberForm({ open, onClose, onCreated }: CreateMemberFormProps) {
  const t = useTranslations("members.createForm");
  const toast = useToast();
  const roleOptions = useRoleOptions();
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [createCompanyMember, { loading }] = useMutation(CREATE_COMPANY_MEMBER);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "email" || key === "nickname") {
      setFieldErrors((current) => ({ ...current, [key]: "" }));
    }
  };

  const handleSubmit = async () => {
    setFieldErrors(EMPTY_FIELD_ERRORS);
    try {
      const { data } = await createCompanyMember({ variables: { user: form } });
      const result = data?.createCompanyMember;
      if (result?.success) {
        toast(t("created"));
        setForm(EMPTY_FORM);
        onCreated();
        onClose();
      } else {
        toast(result?.message ?? t("createFailed"), "error");
      }
    } catch (error: any) {
      const message: string = error?.message ?? "";
      if (/email/i.test(message)) {
        setFieldErrors((current) => ({ ...current, email: t("emailExists") }));
      } else if (/nickname/i.test(message)) {
        setFieldErrors((current) => ({ ...current, nickname: t("usernameExists") }));
      } else {
        toast(message || t("createFailed"), "error");
      }
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: 480 } } }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ px: 4, py: 3 }}>
        <Box>
          <Typography variant="h6">{t("title")}</Typography>
          <Typography variant="body2" sx={{ color: "text.disabled" }}>
            {t("subtitle")}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label={t("cancel")} size="small">
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </Stack>

      <Stack spacing={2.5} sx={{ flex: 1, overflowY: "auto", px: 4, py: 1 }}>
        <TextField
          type="email"
          label={t("email")}
          value={form.email}
          onChange={(event) => set("email")(event.target.value)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email}
        />
        <TextField
          label={t("username")}
          value={form.nickname}
          onChange={(event) => set("nickname")(event.target.value)}
          error={Boolean(fieldErrors.nickname)}
          helperText={fieldErrors.nickname}
        />
        <TextField
          type="password"
          label={t("password")}
          helperText={t("passwordHint")}
          value={form.password}
          onChange={(event) => set("password")(event.target.value)}
        />
        <TextField select label={t("role")} value={form.role} onChange={(event) => set("role")(event.target.value)}>
          {roleOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
          }
          label={t("activateDirectly")}
        />
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ borderTop: 1, borderColor: "divider", px: 4, py: 2 }}>
        <Button variant="text" color="inherit" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          loading={loading}
          disabled={!form.email || !form.nickname || !form.password}
        >
          {t("submit")}
        </Button>
      </Stack>
    </Drawer>
  );
}
