"use client";

import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z as zod } from "zod";

import { useSession } from "@/components/layout/session-provider";
import { Form, Field } from "@/components/hook-form";
import { normalizePhoneNumber } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { UPDATE_USER } from "@/lib/graphql/users";
import type { User } from "@/lib/graphql/types";

const ProfileSchema = zod.object({
  name: zod.string(),
  surname: zod.string(),
  nickname: zod.string().min(1),
  email: zod.string().min(1).email(),
  // El valor guardado son dígitos nacionales sin "+" (ver components/phone-input).
  // Se normaliza antes de validar por si el navegador autorrellenó el
  // formulario entero sin que el campo llegara a perder el foco (el propio
  // input no tiene ocasión de corregirlo) — así absorbe el código de país en
  // vez de fallar la validación con un número que en realidad es correcto.
  // Se valida asumiendo España, mismo supuesto de mercado principal que usa
  // el propio input para interpretar números sin prefijo.
  phoneNumber: zod
    .string()
    .transform((value) => (value ? normalizePhoneNumber(value) : value))
    .refine((value) => !value || isValidPhoneNumber(value, "ES"), { message: "Invalid phone number" }),
});

type ProfileValues = zod.infer<typeof ProfileSchema>;

function toForm(user: User): ProfileValues {
  return {
    name: user.name ?? "",
    surname: user.surname ?? "",
    nickname: user.nickname ?? "",
    email: user.email ?? "",
    phoneNumber: user.phoneNumber ?? "",
  };
}

export function ProfileForm({ user }: { user: User }) {
  const t = useTranslations("profile.profileForm");
  const toast = useToast();
  const { refetch } = useSession();
  const [updateUser, { loading }] = useMutation(UPDATE_USER);

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: toForm(user),
  });
  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods;

  useEffect(() => {
    reset(toForm(user));
  }, [user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await updateUser({
        variables: {
          user: {
            id: user.id,
            name: values.name.trim() || null,
            surname: values.surname.trim() || null,
            nickname: values.nickname.trim(),
            email: values.email.trim(),
            phoneNumber: values.phoneNumber.trim() || null,
          },
        },
      });
      if (data?.updateUser?.success) {
        toast(t("updated"));
        refetch();
      } else {
        toast(data?.updateUser?.message ?? t("updateFailed"), "error");
      }
    } catch {
      toast(t("updateFailed"), "error");
    }
  });

  return (
    <Card variant="outlined">
      <CardHeader title={t("title")} subheader={t("subtitle")} titleTypographyProps={{ variant: "subtitle1" }} />

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text name="name" label={t("name")} autoComplete="given-name" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text name="surname" label={t("surname")} autoComplete="family-name" />
            </Grid>
          </Grid>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text name="nickname" label={t("nickname")} required autoComplete="nickname" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Phone name="phoneNumber" label={t("phone")} helperText={t("phoneHint")} />
            </Grid>
          </Grid>
          <Field.Text name="email" label={t("email")} type="email" required autoComplete="email" />

          <Stack direction="row" justifyContent="flex-end" sx={{ pt: 0.5 }}>
            <Button type="submit" variant="primary" disabled={!isDirty || loading}>
              {loading ? t("saving") : t("saveChanges")}
            </Button>
          </Stack>
        </Stack>
      </Form>
    </Card>
  );
}
