"use client";

import { useMutation, useQuery } from "@apollo/client";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useSession } from "@/components/layout/session-provider";
import { PhoneInput } from "@/components/phone-input";
import { CompanyLogoUpload } from "@/components/settings/company-logo-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { GET_COMPANIES, UPDATE_COMPANY } from "@/lib/graphql/companies";
import type { Company } from "@/lib/graphql/types";

const CONFIG_KEYS = ["pollsEnabled", "productsEnabled", "chatEnabled", "trainingEnabled"] as const;

const OPTION_KEYS = [
  "maxActiveReservations",
  "maxAdvanceBookingDays",
  "fullOpenHours",
  "bookingCutoffMinutes",
  "minBookingsRequired",
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined" sx={{ p: 4 }}>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        {title}
      </Typography>
      {children}
    </Card>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings.page");
  const toast = useToast();
  const { user } = useSession();

  const CONFIG_LABELS: Record<(typeof CONFIG_KEYS)[number], string> = {
    pollsEnabled: t("configLabels.pollsEnabled"),
    productsEnabled: t("configLabels.productsEnabled"),
    chatEnabled: t("configLabels.chatEnabled"),
    trainingEnabled: t("configLabels.trainingEnabled"),
  };

  const OPTION_FIELDS = OPTION_KEYS.map((key) => ({ key, label: t(`optionFields.${key}`) }));
  const companyId = user?.activeCompanyId;

  const { data, loading } = useQuery<{ getCompanies: { company: Company | null; companies: Company[] | null } }>(
    GET_COMPANIES,
    { variables: { companyId }, skip: !companyId },
  );

  const company = data?.getCompanies?.company ?? data?.getCompanies?.companies?.[0] ?? null;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    config: { pollsEnabled: true, productsEnabled: true, chatEnabled: true, trainingEnabled: true },
    options: {
      maxActiveReservations: 0,
      maxAdvanceBookingDays: 0,
      sameDayBookingAllowed: true,
      fullOpenHours: 0,
      bookingCutoffMinutes: 0,
      minBookingsRequired: 0,
    },
  });

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name,
      email: company.email ?? "",
      phoneNumber: company.phoneNumber ?? "",
      address: company.address ?? "",
      config: {
        pollsEnabled: company.companyConfig?.pollsEnabled ?? true,
        productsEnabled: company.companyConfig?.productsEnabled ?? true,
        chatEnabled: company.companyConfig?.chatEnabled ?? true,
        trainingEnabled: company.companyConfig?.trainingEnabled ?? true,
      },
      options: {
        maxActiveReservations: company.scheduleOptions?.maxActiveReservations ?? 0,
        maxAdvanceBookingDays: company.scheduleOptions?.maxAdvanceBookingDays ?? 0,
        sameDayBookingAllowed: company.scheduleOptions?.sameDayBookingAllowed ?? true,
        fullOpenHours: company.scheduleOptions?.fullOpenHours ?? 0,
        bookingCutoffMinutes: company.scheduleOptions?.bookingCutoffMinutes ?? 0,
        minBookingsRequired: company.scheduleOptions?.minBookingsRequired ?? 0,
      },
    });
  }, [company]);

  const [updateCompany, { loading: saving }] = useMutation(UPDATE_COMPANY);

  const handleSave = async () => {
    if (!companyId) return;
    const { data: result } = await updateCompany({
      variables: {
        companyId,
        companyData: {
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber,
          address: form.address,
          code: company?.code || undefined,
          companyConfig: form.config,
        },
        scheduleOptions: form.options,
      },
    });
    if (result?.updateCompany?.success) {
      toast(t("saved"));
    } else {
      toast(result?.updateCompany?.message ?? t("saveFailed"), "error");
    }
  };

  if (loading && !company) {
    return <Skeleton variant="rounded" height={256} />;
  }

  return (
    <Stack spacing={3}>
      <Section title={t("companyData")}>
        {company ? (
          <>
            <CompanyLogoUpload company={company} />
            <Divider sx={{ my: 3 }} />
          </>
        ) : null}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label={t("name")}>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label={t("email")}>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </Field>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label={t("phone")}>
              <PhoneInput value={form.phoneNumber} onChange={(value) => setForm({ ...form, phoneNumber: value ?? "" })} />
            </Field>
          </Grid>
          <Grid size={12}>
            <Field label={t("address")}>
              <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </Field>
          </Grid>
        </Grid>
      </Section>

      <Section title={t("activeModules")}>
        <Grid container spacing={1.5}>
          {(Object.keys(CONFIG_LABELS) as (keyof typeof CONFIG_LABELS)[]).map((key) => (
            <Grid key={key} size={{ xs: 12, md: 6 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ borderRadius: 1.5, border: 1, borderColor: "divider", px: 2, py: 1.5 }}
              >
                <Typography variant="body2">{CONFIG_LABELS[key]}</Typography>
                <Checkbox
                  checked={form.config[key]}
                  onChange={(event) =>
                    setForm({ ...form, config: { ...form.config, [key]: event.target.checked } })
                  }
                />
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section title={t("bookingRules")}>
        <Grid container spacing={2.5}>
          {OPTION_FIELDS.map(({ key, label }) => (
            <Grid key={key} size={{ xs: 12, md: 4 }}>
              <Field label={label}>
                <Input
                  type="number"
                  min={0}
                  value={form.options[key]}
                  onChange={(event) =>
                    setForm({ ...form, options: { ...form.options, [key]: Number(event.target.value) } })
                  }
                />
              </Field>
            </Grid>
          ))}
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", alignItems: "flex-end" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.options.sameDayBookingAllowed}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      options: { ...form.options, sameDayBookingAllowed: event.target.checked },
                    })
                  }
                />
              }
              label={t("sameDayBooking")}
            />
          </Grid>
        </Grid>
      </Section>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="primary" onClick={handleSave} disabled={saving || !companyId}>
          {saving ? t("saving") : t("saveChanges")}
        </Button>
      </Stack>
    </Stack>
  );
}
