"use client";

import { useMutation, useQuery } from "@apollo/client";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { StatusChip, type StatusTone } from "@/components/mui/status-chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatCents, formatDate, planPriceCents } from "@/lib/format";
import { LIST_PLANS } from "@/lib/graphql/plans";
import {
  CANCEL_SUBSCRIPTION,
  CHANGE_PLAN,
  CREATE_SUBSCRIPTION,
  EXTEND_SUBSCRIPTION_PERIOD,
  FORCE_RENEWAL,
  GET_ACTIVE_SUBSCRIPTION,
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

/** Session Pack (Bono): el plan se mide en sesiones, no en tiempo. */
function isSessionPack(plan: Pick<Plan, "sessionCount">): boolean {
  return plan.sessionCount !== null && plan.sessionCount !== undefined;
}

function useStatusLabels() {
  const t = useTranslations("members.subscriptionTab.statusLabels");
  return (status: SubscriptionStatus) => ({
    label: t(status),
    tone: STATUS_TONES[status] ?? "neutral",
  });
}

/**
 * Los rechazos de negocio del back llegan como excepción (GraphQL error), no en
 * el `success: false` del ServiceResponse. Se mapean por el texto del mensaje,
 * que es el único identificador que cruza la API.
 */
function useBackErrorMessage() {
  const t = useTranslations("members.subscriptionTab.errors");
  return (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : "";
    if (/already has an active subscription to this plan/i.test(message)) return t("alreadyLiveInPlan");
    if (/into or out of a session pack/i.test(message)) return t("changeWithSessionPack");
    if (/same as the current plan/i.test(message)) return t("samePlan");
    if (/only active or trialing subscriptions can change plan/i.test(message)) return t("notChangeable");
    return message || fallback;
  };
}

function planLabel(plan: Plan): string {
  return `${plan.name} · ${formatCents(planPriceCents(plan), plan.currency)}`;
}

function SubscriptionCard({
  subscription,
  live,
  plans,
  livePlanIds,
  onChanged,
}: {
  subscription: Subscription;
  live: boolean;
  plans: Plan[];
  livePlanIds: Set<string>;
  onChanged: () => void;
}) {
  const t = useTranslations("members.subscriptionTab");
  const statusLabel = useStatusLabels();
  const toast = useToast();
  const backErrorMessage = useBackErrorMessage();
  const [extendDays, setExtendDays] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [showExtend, setShowExtend] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [newPlanId, setNewPlanId] = useState("");
  const [prorate, setProrate] = useState(false);
  const [confirmChange, setConfirmChange] = useState(false);

  const options = { onCompleted: onChanged };
  const [pause, pauseState] = useMutation(PAUSE_SUBSCRIPTION, options);
  const [resume, resumeState] = useMutation(RESUME_SUBSCRIPTION, options);
  const [cancel, cancelState] = useMutation(CANCEL_SUBSCRIPTION, options);
  const [forceRenewal, renewState] = useMutation(FORCE_RENEWAL, options);
  const [extend, extendState] = useMutation(EXTEND_SUBSCRIPTION_PERIOD, options);
  const [changePlan, changeState] = useMutation(CHANGE_PLAN);

  /** Las acciones sueltas de la tarjeta: un rechazo del back tiene que verse. */
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      toast(backErrorMessage(error, t("actionFailed")), "error");
    }
  };

  const busy =
    pauseState.loading ||
    resumeState.loading ||
    cancelState.loading ||
    renewState.loading ||
    extendState.loading ||
    changeState.loading;

  const status = statusLabel(subscription.status);
  const finished = subscription.status === "canceled" || subscription.status === "incomplete_expired";
  const pack = isSessionPack(subscription.plan);
  // El back rechaza un cambio hacia o desde un Session Pack: no se ofrece.
  const changeable = live && !pack;

  // Destinos posibles: ni el plan actual, ni un Session Pack, ni uno que el
  // miembro ya sostenga vigente — las tres cosas que el back rechaza.
  const changeOptions = plans
    .filter((plan) => plan.id !== subscription.plan.id && !isSessionPack(plan) && !livePlanIds.has(plan.id))
    .map((plan) => ({ value: plan.id, label: planLabel(plan) }));

  const newPlan = plans.find((plan) => plan.id === newPlanId) ?? null;

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

  const handleChangePlan = async () => {
    if (!newPlanId) return;
    try {
      const { data } = await changePlan({
        variables: { input: { subscriptionId: subscription.id, newPlanId, prorate } },
      });
      if (data?.changePlan?.success) {
        toast(t("planChanged", { plan: newPlan?.name ?? "" }));
        setConfirmChange(false);
        setShowChange(false);
        setNewPlanId("");
        setProrate(false);
        onChanged();
      } else {
        toast(data?.changePlan?.message ?? t("planChangeFailed"), "error");
      }
    } catch (error) {
      setConfirmChange(false);
      toast(backErrorMessage(error, t("planChangeFailed")), "error");
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2">{subscription.plan.name}</Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {pack
              ? formatCents(planPriceCents(subscription.plan), subscription.plan.currency)
              : `${formatCents(planPriceCents(subscription.plan), subscription.plan.currency)} / ${subscription.plan.interval}`}
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
            {pack ? t("remainingCredits") : t("nextBilling")}
          </Typography>
          <Typography variant="body2">
            {pack
              ? t("creditsOf", {
                  remaining: subscription.remainingCredits ?? 0,
                  total: subscription.creditsTotal ?? 0,
                })
              : formatDate(subscription.nextBillingDate)}
          </Typography>
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
                onClick={() => run(() => resume({ variables: { subscriptionId: subscription.id } }))}
              >
                {t("resume")}
              </Button>
            ) : (
              <Button
                size="small"
                variant="soft"
                color="inherit"
                disabled={busy}
                onClick={() => run(() => pause({ variables: { subscriptionId: subscription.id } }))}
              >
                {t("pause")}
              </Button>
            )}
            <Button
              size="small"
              variant="soft"
              color="inherit"
              disabled={busy}
              onClick={() => run(() => forceRenewal({ variables: { subscriptionId: subscription.id } }))}
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
            {changeable ? (
              <Button
                size="small"
                variant="soft"
                color="warning"
                disabled={busy}
                onClick={() => setShowChange((value) => !value)}
              >
                {t("changePlan")}
              </Button>
            ) : null}
            <Button
              size="small"
              variant="contained"
              color="error"
              disabled={busy}
              onClick={() =>
                run(() =>
                  cancel({
                    variables: { input: { subscriptionId: subscription.id, cancelAtPeriodEnd: true } },
                  })
                )
              }
            >
              {t("cancel")}
            </Button>
          </Stack>
        </>
      ) : null}

      {showChange ? (
        <Stack spacing={1.5} sx={{ mt: 2, borderRadius: 1, bgcolor: "background.neutral", p: 2 }}>
          <Typography variant="subtitle2">{t("changePlanTitle", { plan: subscription.plan.name })}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("changePlanHint")}
          </Typography>
          <Autocomplete
            size="small"
            fullWidth
            options={changeOptions}
            value={changeOptions.find((option) => option.value === newPlanId) ?? null}
            onChange={(_event, value) => setNewPlanId(value?.value ?? "")}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            noOptionsText={t("noChangeTargets")}
            renderInput={(params) => <TextField {...params} label={t("newPlan")} placeholder={t("selectPlan")} />}
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={prorate} onChange={(event) => setProrate(event.target.checked)} />}
            label={<Typography variant="body2">{t("prorate")}</Typography>}
          />
          <Box>
            <Button
              size="small"
              variant="contained"
              color="warning"
              disabled={!newPlanId || busy}
              onClick={() => setConfirmChange(true)}
            >
              {t("confirmChangePlan")}
            </Button>
          </Box>
        </Stack>
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

      <ConfirmDialog
        open={confirmChange}
        title={t("confirmChangeTitle")}
        description={t("confirmChangeDescription", {
          from: subscription.plan.name,
          to: newPlan?.name ?? "",
        })}
        confirmLabel={t("confirmChangePlan")}
        danger
        loading={changeState.loading}
        onConfirm={handleChangePlan}
        onCancel={() => setConfirmChange(false)}
      />
    </Card>
  );
}

export function SubscriptionTab({ userId, role }: { userId: string; role?: UserRole | null }) {
  const t = useTranslations("members.subscriptionTab");
  const toast = useToast();
  const backErrorMessage = useBackErrorMessage();
  const [planId, setPlanId] = useState("");

  const { data, loading, refetch } = useQuery<{
    listUserSubscriptions: { subscriptions: Subscription[] | null };
  }>(LIST_USER_SUBSCRIPTIONS, { variables: { userId } });

  // El Entitlement: quién está vigente lo decide el back, no el status.
  const active = useQuery<{
    getActiveSubscription: { subscriptions: Subscription[] | null };
  }>(GET_ACTIVE_SUBSCRIPTION, { variables: { userId } });

  const plans = useQuery<{ listPlans: { plans: Plan[] | null } }>(LIST_PLANS, {
    variables: { onlyActive: true, showGlobal: role === "admin" },
  });

  const [createSubscription, createState] = useMutation(CREATE_SUBSCRIPTION);

  const refetchAll = () => {
    refetch();
    active.refetch();
  };

  const allSubscriptions = data?.listUserSubscriptions?.subscriptions ?? [];
  const liveSubscriptions = active.data?.getActiveSubscription?.subscriptions ?? [];
  const liveIds = new Set(liveSubscriptions.map((subscription) => subscription.id));
  const livePlanIds = new Set(liveSubscriptions.map((subscription) => subscription.plan.id));
  const otherSubscriptions = allSubscriptions.filter((subscription) => !liveIds.has(subscription.id));

  const planList = plans.data?.listPlans?.plans ?? [];
  const planOptions = planList.map((plan) => ({
    value: plan.id,
    label: livePlanIds.has(plan.id) ? `${planLabel(plan)} · ${t("alreadyLive")}` : planLabel(plan),
  }));

  const selectedPlan = planList.find((plan) => plan.id === planId) ?? null;
  const selectedAlreadyLive = Boolean(selectedPlan && livePlanIds.has(selectedPlan.id));

  const handleCreate = async () => {
    try {
      const { data: result } = await createSubscription({ variables: { subscription: { planId, userId } } });
      if (result?.createSubscription?.success) {
        toast(t("subscriptionCreated"));
        setPlanId("");
        refetchAll();
      } else {
        toast(result?.createSubscription?.message ?? t("subscriptionCreateFailed"), "error");
      }
    } catch (error) {
      toast(backErrorMessage(error, t("subscriptionCreateFailed")), "error");
    }
  };

  if ((loading && !data) || (active.loading && !active.data)) {
    return <Skeleton variant="rounded" height={128} />;
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("liveSection", { count: liveSubscriptions.length })}
        </Typography>
        {liveSubscriptions.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.disabled", py: 1 }}>
            {t("noLiveSubscriptions")}
          </Typography>
        ) : (
          <Stack spacing={2}>
            {liveSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                live
                plans={planList}
                livePlanIds={livePlanIds}
                onChanged={refetchAll}
              />
            ))}
          </Stack>
        )}
      </Box>

      <Divider />

      {/* Añadir SIEMPRE añade: las vigentes se quedan como están. */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {t("addPlanTitle")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
          {t("addPlanHint")}
        </Typography>
        {selectedAlreadyLive ? (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            {t("errors.alreadyLiveInPlan")}
          </Alert>
        ) : null}
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
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
            {t("addPlan")}
          </Button>
        </Stack>
      </Box>

      {otherSubscriptions.length > 0 ? (
        <>
          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("otherSection")}
            </Typography>
            <Stack spacing={2}>
              {otherSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  live={false}
                  plans={planList}
                  livePlanIds={livePlanIds}
                  onChanged={refetchAll}
                />
              ))}
            </Stack>
          </Box>
        </>
      ) : null}
    </Stack>
  );
}
