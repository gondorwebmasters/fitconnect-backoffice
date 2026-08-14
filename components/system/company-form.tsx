"use client";

import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z as zod } from "zod";

import { Form, Field } from "@/components/hook-form";
import { normalizePhoneNumber } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CREATE_COMPANY, UPDATE_COMPANY } from "@/lib/graphql/companies";
import type { Company } from "@/lib/graphql/types";

const CONFIG_KEYS = ["pollsEnabled", "productsEnabled", "chatEnabled", "trainingEnabled"] as const;

const CompanySchema = zod.object({
  name: zod.string().min(1),
  email: zod.string().min(1).email(),
  // Se normaliza por si el navegador autorrellenó el formulario entero sin
  // que este campo llegara a perder el foco (absorbe el código de país en
  // vez de dejarlo pegado al número, ver components/phone-input).
  phoneNumber: zod.string().transform((value) => (value ? normalizePhoneNumber(value) : value)),
  address: zod.string().min(1),
  code: zod.string(),
});

type CompanyValues = zod.infer<typeof CompanySchema>;

const CompanyConfigSchema = CompanySchema.extend({
  config: zod.object({
    pollsEnabled: zod.boolean(),
    productsEnabled: zod.boolean(),
    chatEnabled: zod.boolean(),
    trainingEnabled: zod.boolean(),
  }),
});

type CompanyConfigValues = zod.infer<typeof CompanyConfigSchema>;

export function CreateCompanyForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations("system.companyForm");
  const toast = useToast();
  const [createCompany, { loading }] = useMutation(CREATE_COMPANY);

  const methods = useForm<CompanyValues>({
    resolver: zodResolver(CompanySchema),
    defaultValues: { name: "", email: "", phoneNumber: "", address: "", code: "" },
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const { data } = await createCompany({ variables: { company: values } });
      if (data?.createCompany?.success) {
        toast(t("created"));
        onDone();
      } else {
        toast(data?.createCompany?.message ?? t("createFailed"), "error");
      }
    } catch {
      toast(t("createFailed"), "error");
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <Field.Text name="name" label={t("name")} required autoFocus />
        <Field.Text name="email" type="email" label={t("email")} required />
        <Field.Phone name="phoneNumber" label={t("phone")} />
        <Field.Text name="address" label={t("address")} required />
        <Field.Text
          name="code"
          label={t("accessCode")}
          helperText={t("accessCodeHint")}
          required
          sx={{ "& input": { fontFamily: "monospace", letterSpacing: "0.1em" } }}
        />
        <Stack direction="row" justifyContent="flex-end" sx={{ pt: 0.5 }}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t("creating") : t("createCompany")}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}

export function EditCompanyForm({ company, onDone }: { company: Company; onDone: () => void }) {
  const t = useTranslations("system.companyForm");
  const toast = useToast();

  const CONFIG_LABELS: Record<(typeof CONFIG_KEYS)[number], string> = {
    pollsEnabled: t("configLabels.pollsEnabled"),
    productsEnabled: t("configLabels.productsEnabled"),
    chatEnabled: t("configLabels.chatEnabled"),
    trainingEnabled: t("configLabels.trainingEnabled"),
  };
  const [updateCompany, { loading }] = useMutation(UPDATE_COMPANY);

  const methods = useForm<CompanyConfigValues>({
    resolver: zodResolver(CompanyConfigSchema),
    defaultValues: {
      name: company.name,
      email: company.email ?? "",
      phoneNumber: company.phoneNumber ?? "",
      address: company.address ?? "",
      code: company.code ?? "",
      config: {
        pollsEnabled: company.companyConfig?.pollsEnabled ?? true,
        productsEnabled: company.companyConfig?.productsEnabled ?? true,
        chatEnabled: company.companyConfig?.chatEnabled ?? true,
        trainingEnabled: company.companyConfig?.trainingEnabled ?? true,
      },
    },
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const { data } = await updateCompany({
        variables: {
          companyId: company.id,
          companyData: {
            name: values.name,
            email: values.email,
            phoneNumber: values.phoneNumber,
            address: values.address,
            code: values.code || undefined,
            companyConfig: values.config,
          },
          scheduleOptions: {
            maxActiveReservations: company.scheduleOptions?.maxActiveReservations,
            maxAdvanceBookingDays: company.scheduleOptions?.maxAdvanceBookingDays,
            sameDayBookingAllowed: company.scheduleOptions?.sameDayBookingAllowed,
            fullOpenHours: company.scheduleOptions?.fullOpenHours,
            bookingCutoffMinutes: company.scheduleOptions?.bookingCutoffMinutes,
            minBookingsRequired: company.scheduleOptions?.minBookingsRequired,
          },
        },
      });
      if (data?.updateCompany?.success) {
        toast(t("updated"));
        onDone();
      } else {
        toast(data?.updateCompany?.message ?? t("updateFailed"), "error");
      }
    } catch {
      toast(t("updateFailed"), "error");
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <Field.Text name="name" label={t("name")} required />
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field.Text name="email" type="email" label={t("email")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field.Phone name="phoneNumber" label={t("phone")} />
          </Grid>
        </Grid>
        <Field.Text name="address" label={t("address")} />
        <Field.Text
          name="code"
          label={t("accessCode")}
          helperText={t("accessCodeHint")}
          sx={{ "& input": { fontFamily: "monospace", letterSpacing: "0.1em" } }}
        />

        <Stack spacing={1}>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t("activeModules")}
          </Typography>
          <Stack spacing={1}>
            {(Object.keys(CONFIG_LABELS) as (keyof typeof CONFIG_LABELS)[]).map((key) => (
              <Stack
                key={key}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ borderRadius: 1.5, border: 1, borderColor: "divider", px: 2, py: 1.25 }}
              >
                <Typography variant="body2">{CONFIG_LABELS[key]}</Typography>
                <Field.Checkbox name={`config.${key}`} label="" sx={{ m: 0 }} />
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" sx={{ pt: 0.5 }}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t("saving") : t("saveChanges")}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}
