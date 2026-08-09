"use client";

import { useMutation, useQuery } from "@apollo/client";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { StatusChip, type StatusTone } from "@/components/mui/status-chip";
import { useToast } from "@/components/ui/toast";
import { formatCents, formatDate, planPriceCents } from "@/lib/format";
import { LIST_PLANS } from "@/lib/graphql/plans";
import {
  CANCEL_SUBSCRIPTION,
  CREATE_SUBSCRIPTION,
  EXTEND_SUBSCRIPTION_PERIOD,
  FORCE_RENEWAL,
  LIST_USER_SUBSCRIPTIONS,
  PAUSE_SUBSCRIPTION,
  RESUME_SUBSCRIPTION,
} from "@/lib/graphql/subscriptions";
import type { Plan, Subscription, SubscriptionStatus, UserRole } from "@/lib/graphql/types";

const STATUS_TONES: Record<SubscriptionStatus, StatusTone> = {
  active: "positive",
  trialing: "neutral",
  past_due: "warning",
  paused: "muted",
  canceled: "muted",
  unpaid: "negative",
  incomplete: "warning",
  incomplete_expired: "muted",
};

function useStatusLabels() {
  const t = useTranslations("members.subscriptionTab.statusLabels");
  return (status: SubscriptionStatus) => ({
    label: t(status),
    tone: STATUS_TONES[status] ?? "neutral",
  });
}

function SubscriptionCard({ subscription, onChanged }: { subscription: Subscription; onChanged: () => void }) {
  const t = useTranslations("members.subscriptionTab");
  const statusLabel = useStatusLabels();
  const toast = useToast();
  const [extendDays, setExtendDays] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [showExtend, setShowExtend] = useState(false);

  const options = { onCompleted: onChanged };
  const [pause, pauseState] = useMutation(PAUSE_SUBSCRIPTION, options);
  const [resume, resumeState] = useMutation(RESUME_SUBSCRIPTION, options);
  const [cancel, cancelState] = useMutation(CANCEL_SUBSCRIPTION, options);
  const [forceRenewal, renewState] = useMutation(FORCE_RENEWAL, options);
  const [extend, extendState] = useMutation(EXTEND_SUBSCRIPTION_PERIOD, options);

  const busy =
    pauseState.loading || resumeState.loading || cancelState.loading || renewState.loading || extendState.loading;

  const status = statusLabel(subscription.status);
  const finished = subscription.status === "canceled" || subscription.status === "incomplete_expired";

  const handleExtend = async () => {
    const days = Number(extendDays);
    if (!days || !extendReason) return;
    const { data } = await extend({
      variables: { subscriptionId: subscription.id, days, reason: extendReason },
    });
    if (data?.extendSubscriptionPeriod?.success) {
      toast(t("periodExtended", { days }));
      setShowExtend(false);
      setExtendDays("");
      setExtendReason("");
    } else {
      toast(data?.extendSubscriptionPeriod?.message ?? t("extendFailed"), "error");
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2">{subscription.plan.name}</Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {formatCents(planPriceCents(subscription.plan), subscription.plan.currency)} / {subscription.plan.interval}
          </Typography>
        </Box>
        <StatusChip tone={status.tone} label={status.label} />
      </Stack>

      <Grid container spacing={1} sx={{ mt: 1.5 }}>
        <Grid size={6}>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            {t("periodEnd")}
          </Typography>
          <Typography variant="body2">{formatDate(subscription.currentPeriodEnd)}</Typography>
        </Grid>
        <Grid size={6}>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            {t("nextBilling")}
          </Typography>
          <Typography variant="body2">{formatDate(subscription.nextBillingDate)}</Typography>
        </Grid>
        {subscription.failedPaymentAttempts > 0 ? (
          <Grid size={12}>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
              {t("failedAttempts")}
            </Typography>
            <Typography variant="body2" sx={{ color: "error.main" }}>
              {subscription.failedPaymentAttempts}
            </Typography>
          </Grid>
        ) : null}
        {subscription.cancelAtPeriodEnd ? (
          <Grid size={12}>
            <Typography variant="body2" sx={{ color: "warning.dark" }}>
              {t("willCancelAtPeriodEnd")}
            </Typography>
          </Grid>
        ) : null}
      </Grid>

      {!finished ? (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {subscription.status === "paused" ? (
              <Button
                size="small"
                variant="soft"
                color="inherit"
                disabled={busy}
                onClick={() => resume({ variables: { subscriptionId: subscription.id } })}
              >
                {t("resume")}
              </Button>
            ) : (
              <Button
                size="small"
                variant="soft"
                color="inherit"
                disabled={busy}
                onClick={() => pause({ variables: { subscriptionId: subscription.id } })}
              >
                {t("pause")}
              </Button>
            )}
            <Button
              size="small"
              variant="soft"
              color="inherit"
              disabled={busy}
              onClick={() => forceRenewal({ variables: { subscriptionId: subscription.id } })}
            >
              {t("renewNow")}
            </Button>
            <Button
              size="small"
              variant="soft"
              color="inherit"
              disabled={busy}
              onClick={() => setShowExtend((value) => !value)}
            >
              {t("extend")}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              disabled={busy}
              onClick={() =>
                cancel({
                  variables: { input: { subscriptionId: subscription.id, cancelAtPeriodEnd: true } },
                })
              }
            >
              {t("cancel")}
            </Button>
          </Stack>
        </>
      ) : null}

      {showExtend ? (
        <Stack spacing={1.5} sx={{ mt: 2, borderRadius: 1, bgcolor: "background.neutral", p: 2 }}>
          <Grid container spacing={1.5}>
            <Grid size={6}>
              <TextField
                type="number"
                size="small"
                label={t("days")}
                slotProps={{ htmlInput: { min: 1 } }}
                value={extendDays}
                onChange={(event) => setExtendDays(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                size="small"
                label={t("reason")}
                helperText={t("reasonHint")}
                value={extendReason}
                onChange={(event) => setExtendReason(event.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
          <Box>
            <Button
              size="small"
              variant="contained"
              onClick={handleExtend}
              loading={extendState.loading}
              disabled={!extendDays || !extendReason}
            >
              {t("confirmExtend")}
            </Button>
          </Box>
        </Stack>
      ) : null}
    </Card>
  );
}

export function SubscriptionTab({ userId, role }: { userId: string; role?: UserRole | null }) {
  const t = useTranslations("members.subscriptionTab");
  const toast = useToast();
  const [planId, setPlanId] = useState("");

  const { data, loading, refetch } = useQuery<{
    listUserSubscriptions: { subscriptions: Subscription[] | null };
  }>(LIST_USER_SUBSCRIPTIONS, { variables: { userId } });

  const plans = useQuery<{ listPlans: { plans: Plan[] | null } }>(LIST_PLANS, {
    variables: { onlyActive: true, showGlobal: role === "admin" },
  });

  const [createSubscription, createState] = useMutation(CREATE_SUBSCRIPTION);

  const subscriptions = data?.listUserSubscriptions?.subscriptions ?? [];
  const hasOngoing = subscriptions.some((subscription) =>
    ["active", "trialing", "past_due", "paused"].includes(subscription.status),
  );

  const planOptions = (plans.data?.listPlans?.plans ?? []).map((plan) => ({
    value: plan.id,
    label: `${plan.name} · ${formatCents(planPriceCents(plan), plan.currency)}`,
  }));

  const handleCreate = async () => {
    const { data: result } = await createSubscription({ variables: { subscription: { planId, userId } } });
    if (result?.createSubscription?.success) {
      toast(t("subscriptionCreated"));
      setPlanId("");
      refetch();
    } else {
      toast(result?.createSubscription?.message ?? t("subscriptionCreateFailed"), "error");
    }
  };

  if (loading && !data) {
    return <Skeleton variant="rounded" height={128} />;
  }

  return (
    <Stack spacing={2}>
      {subscriptions.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 2 }}>
          {t("noSubscriptions")}
        </Typography>
      ) : (
        subscriptions.map((subscription) => (
          <SubscriptionCard key={subscription.id} subscription={subscription} onChanged={() => refetch()} />
        ))
      )}

      {!hasOngoing ? (
        <>
          <Divider />
          <Stack direction="row" alignItems="flex-end" spacing={1.5}>
            <Autocomplete
              size="small"
              fullWidth
              options={planOptions}
              value={planOptions.find((option) => option.value === planId) ?? null}
              onChange={(_event, value) => setPlanId(value?.value ?? "")}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              renderInput={(params) => <TextField {...params} label={t("assignPlan")} placeholder={t("selectPlan")} />}
            />
            <Button variant="contained" onClick={handleCreate} loading={createState.loading} disabled={!planId}>
              {t("subscribe")}
            </Button>
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}
