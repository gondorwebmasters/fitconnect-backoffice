"use client";
import { Iconify } from "@/components/iconify";

import { useMutation, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useSession } from "@/components/layout/session-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { fullName } from "@/lib/format";
import { GET_COMPANIES, UPDATE_COMPANY } from "@/lib/graphql/companies";
import type { Company, User } from "@/lib/graphql/types";
import { GET_USERS } from "@/lib/graphql/users";

type CompaniesData = { getCompanies: { company: Company | null; companies: Company[] | null } };
type UsersData = { getUsers: { users: User[] | null } };

export default function OnboardingSettingsPage() {
  const t = useTranslations("settings.onboarding");
  const toast = useToast();
  const { user } = useSession();
  const companyId = user?.activeCompanyId;
  const [code, setCode] = useState("");

  const { data, loading } = useQuery<CompaniesData>(GET_COMPANIES, {
    variables: { companyId },
    skip: !companyId,
  });
  const company = data?.getCompanies?.company ?? data?.getCompanies?.companies?.[0] ?? null;

  const { data: pendingData } = useQuery<UsersData>(GET_USERS, {
    variables: { page: 0, stateFilter: "pending" },
  });
  const pending = pendingData?.getUsers?.users ?? [];

  useEffect(() => {
    if (company) setCode(company.code ?? "");
  }, [company]);

  const [updateCompany, { loading: saving }] = useMutation(UPDATE_COMPANY);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast(t("codeCopied"));
  };

  const handleSave = async () => {
    if (!companyId || !company) return;
    const { data: result } = await updateCompany({
      variables: {
        companyId,
        companyData: {
          name: company.name,
          email: company.email,
          phoneNumber: company.phoneNumber,
          address: company.address,
          code: code || undefined,
          companyConfig: company.companyConfig
            ? {
                pollsEnabled: company.companyConfig.pollsEnabled,
                productsEnabled: company.companyConfig.productsEnabled,
                chatEnabled: company.companyConfig.chatEnabled,
                trainingEnabled: company.companyConfig.trainingEnabled,
              }
            : undefined,
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
    if (result?.updateCompany?.success) {
      toast(t("codeUpdated"));
    } else {
      toast(result?.updateCompany?.message ?? t("codeUpdateFailed"), "error");
    }
  };

  if (loading && !company) {
    return <Skeleton variant="rounded" height={256} sx={{ maxWidth: 672 }} />;
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 672 }}>
      <Card variant="outlined">
        <CardHeader title={t("accessCode")} subheader={t("accessCodeSubtitle")} titleTypographyProps={{ variant: "subtitle1" }} />
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Stack direction="row" alignItems="flex-end" spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Field label={t("currentCode")}>
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  sx={{ fontFamily: "monospace", letterSpacing: "0.1em" }}
                />
              </Field>
            </Box>
            <Button variant="secondary" onClick={handleCopy} disabled={!code} aria-label={t("copyCode")}>
              <Iconify icon="solar:copy-bold" width={14} />
              {t("copy")}
            </Button>
          </Stack>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !company || code === (company.code ?? "")}
            >
              {saving ? t("saving") : t("saveCode")}
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title={t("admissionRequests")}
          subheader={pending.length === 0 ? t("noPendingRequests") : t("waitingCount", { count: pending.length })}
          titleTypographyProps={{ variant: "subtitle1" }}
        />
        <Box sx={{ p: 3 }}>
          {pending.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 2 }}>
              {t("noneWaiting")}
            </Typography>
          ) : (
            <List disablePadding>
              {pending.slice(0, 5).map((pendingUser) => (
                <ListItem key={pendingUser.id} divider sx={{ px: 0, gap: 1.5 }}>
                  <Avatar size="sm" name={fullName(pendingUser)} url={pendingUser.pictureUrl?.url} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {fullName(pendingUser)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.disabled" }} noWrap>
                      {pendingUser.email}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Link href="/members">
              <Button variant="secondary">{t("manageInMembers")}</Button>
            </Link>
          </Stack>
        </Box>
      </Card>
    </Stack>
  );
}
