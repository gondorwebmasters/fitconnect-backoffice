"use client";
import { Iconify } from "@/components/iconify";

import { useMutation, useQuery } from "@apollo/client";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useSession } from "@/components/layout/session-provider";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  DISCONNECT_PAYMENT_ACCOUNT,
  GET_PAYMENT_CONNECTION_STATUS,
  GET_PAYMENT_ONBOARDING_URL,
  type PaymentConnectionStatus,
} from "@/lib/graphql/payments";

type StatusData = {
  getPaymentConnectionStatus: {
    success: boolean;
    message: string;
    status: PaymentConnectionStatus | null;
  } | null;
};

export default function FinanceSettingsPage() {
  const t = useTranslations("settings.finance");
  const toast = useToast();
  const { user } = useSession();
  const companyId = user?.activeCompanyId;
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  const { data, loading, refetch } = useQuery<StatusData>(GET_PAYMENT_CONNECTION_STATUS, {
    variables: { companyId },
    skip: !companyId,
  });

  const [getOnboardingUrl, { loading: connecting }] = useMutation(GET_PAYMENT_ONBOARDING_URL);
  const [disconnect, { loading: disconnecting }] = useMutation(DISCONNECT_PAYMENT_ACCOUNT);

  const status = data?.getPaymentConnectionStatus?.status ?? null;
  const connected = status?.isConnected ?? false;

  const handleConnect = async () => {
    if (!companyId) return;
    try {
      const { data: result } = await getOnboardingUrl({
        variables: { companyId, platform: "web" },
      });
      const url = result?.getPaymentOnboardingUrl?.url;
      if (result?.getPaymentOnboardingUrl?.success && url) {
        window.location.href = url;
      } else {
        toast(result?.getPaymentOnboardingUrl?.message ?? t("connectFailed"), "error");
      }
    } catch {
      toast(t("connectFailed"), "error");
    }
  };

  const handleDisconnect = async () => {
    if (!companyId) return;
    try {
      const { data: result } = await disconnect({ variables: { companyId } });
      if (result?.disconnectPaymentAccount?.success) {
        toast(t("disconnected"));
        refetch();
      } else {
        toast(result?.disconnectPaymentAccount?.message ?? t("disconnectFailed"), "error");
      }
    } catch {
      toast(t("disconnectFailed"), "error");
    } finally {
      setConfirmingDisconnect(false);
    }
  };

  if (loading && !data) {
    return <Skeleton variant="rounded" height={256} sx={{ maxWidth: 672 }} />;
  }

  return (
    <Box sx={{ maxWidth: 672 }}>
      <Card variant="outlined">
        <CardHeader title={t("title")} subheader={t("subtitle")} titleTypographyProps={{ variant: "subtitle1" }} />

        <Stack spacing={2.5} sx={{ p: 3 }}>
          {connected ? (
            <>
              <Alert severity="success">{t("accountConnected")}</Alert>

              <Stack spacing={1.5}>
                {status?.accountId ? (
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {t("account")}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block" }}>
                      {status.accountId}
                    </Typography>
                  </Box>
                ) : null}
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {t("capabilities")}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 0.75 }}>
                    <Chip tone={status?.chargesEnabled ? "success" : "warning"}>
                      {status?.chargesEnabled ? t("chargesActive") : t("chargesPending")}
                    </Chip>
                    <Chip tone={status?.payoutsEnabled ? "success" : "warning"}>
                      {status?.payoutsEnabled ? t("payoutsActive") : t("payoutsPending")}
                    </Chip>
                  </Stack>
                </Box>
              </Stack>

              {status?.missingRequirements?.length ? (
                <Alert severity="warning" icon={<Iconify icon="solar:danger-triangle-bold" width={16} />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t("missingRequirements")}
                  </Typography>
                  <Box component="ul" sx={{ mt: 0.5, pl: 2.5, typography: "caption" }}>
                    {status.missingRequirements.filter(Boolean).map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </Box>
                </Alert>
              ) : null}

              {status?.disabledReason ? <Alert severity="error">{status.disabledReason}</Alert> : null}

              <Stack direction="row" flexWrap="wrap" justifyContent="flex-end" spacing={1.5}>
                {!status?.chargesEnabled ? (
                  <Button variant="primary" onClick={handleConnect} disabled={connecting}>
                    {connecting ? t("redirecting") : t("completeSetup")}
                  </Button>
                ) : null}
                <Button variant="danger" onClick={() => setConfirmingDisconnect(true)}>
                  <Iconify icon="mdi:power-plug-off" width={14} />
                  {t("disconnect")}
                </Button>
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t("connectDescription")}
              </Typography>
              <Stack direction="row" justifyContent="flex-end">
                <Button variant="primary" onClick={handleConnect} disabled={connecting || !companyId}>
                  {connecting ? t("redirecting") : t("connect")}
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Card>

      <ConfirmDialog
        open={confirmingDisconnect}
        title={t("disconnectTitle")}
        description={t("disconnectDescription")}
        confirmLabel={t("disconnect")}
        danger
        loading={disconnecting}
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmingDisconnect(false)}
      />
    </Box>
  );
}
