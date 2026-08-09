"use client";
import { Iconify } from "@/components/iconify";

import { useMutation } from "@apollo/client";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown } from "@/components/ui/dropdown";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { planPriceCents } from "@/lib/format";
import { CREATE_PLAN, UPDATE_PLAN } from "@/lib/graphql/plans";
import type { Plan } from "@/lib/graphql/types";

const INTERVAL_VALUES = ["day", "week", "month", "year"] as const;

const SUPPORT_LEVEL_VALUES = ["email", "chat", "phone"] as const;

const PERMISSION_ACTIONS = ["create", "read", "update", "delete", "manage"] as const;

const PERMISSION_MODULES = [
  "users",
  "schedules",
  "payments",
  "settings",
  "promotions",
  "chats",
  "polls",
  "workouts",
  "plans",
  "products",
  "user_weights",
  "stats",
  "companies",
  "subscriptions",
  "transactions",
  "invoices",
] as const;

const STANDARD_PERMISSIONS = ["schedules:read", "users:read", "polls:read"];
const PREMIUM_PERMISSIONS = [
  ...STANDARD_PERMISSIONS,
  "workouts:read",
  "user_weights:read",
  "user_weights:create",
  "user_weights:update",
  "user_weights:delete",
];

const EMPTY_FORM = {
  name: "",
  description: "",
  amount: "",
  interval: INTERVAL_VALUES[0] as (typeof INTERVAL_VALUES)[number],
  trialPeriodDays: "",
  features: [] as string[],
  maxUsers: "",
  supportLevel: "email",
  permissions: STANDARD_PERMISSIONS as string[],
};

function FeatureListInput({
  features,
  onChange,
  placeholder,
}: {
  features: string[];
  onChange: (features: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const addFeature = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...features, value]);
    setDraft("");
  };

  const removeFeature = (index: number) => {
    onChange(features.filter((_, i) => i !== index));
  };

  return (
    <Stack spacing={1}>
      {features.length > 0 ? (
        <Stack component="ul" spacing={0.75} sx={{ listStyle: "none", p: 0, m: 0 }}>
          {features.map((feature, index) => (
            <Stack
              component="li"
              key={index}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ borderRadius: 1.5, border: 1, borderColor: "divider", bgcolor: "background.neutral", px: 1.5, py: 0.75 }}
            >
              <Typography variant="body2" noWrap>
                {feature}
              </Typography>
              <IconButton size="small" onClick={() => removeFeature(index)} sx={{ color: "text.disabled" }}>
                <Iconify icon="mingcute:close-line" width={14} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      ) : null}
      <Stack direction="row" spacing={1}>
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addFeature();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={addFeature} disabled={!draft.trim()}>
          <Iconify icon="mingcute:add-line" width={16} />
        </Button>
      </Stack>
    </Stack>
  );
}

function PermissionsMatrix({
  permissions,
  onChange,
  moduleLabel,
  actionLabel,
}: {
  permissions: string[];
  onChange: (permissions: string[]) => void;
  moduleLabel: (module: (typeof PERMISSION_MODULES)[number]) => string;
  actionLabel: (action: (typeof PERMISSION_ACTIONS)[number]) => string;
}) {
  const has = (name: string) => permissions.includes(name);

  const toggle = (name: string) => {
    onChange(has(name) ? permissions.filter((p) => p !== name) : [...permissions, name]);
  };

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 288 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>·</TableCell>
            {PERMISSION_ACTIONS.map((action) => (
              <TableCell key={action} align="center">
                {actionLabel(action)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {PERMISSION_MODULES.map((module) => (
            <TableRow key={module}>
              <TableCell>{moduleLabel(module)}</TableCell>
              {PERMISSION_ACTIONS.map((action) => {
                const name = `${module}:${action}`;
                return (
                  <TableCell key={action} align="center" sx={{ p: 0.5 }}>
                    <Checkbox checked={has(name)} onChange={() => toggle(name)} />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface PlanFormProps {
  open: boolean;
  plan: Plan | null; // null = crear
  onClose: () => void;
  onSaved: () => void;
}

export function PlanForm({ open, plan, onClose, onSaved }: PlanFormProps) {
  const t = useTranslations("plans.form");
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const INTERVAL_OPTIONS = INTERVAL_VALUES.map((value) => ({ value, label: t(`intervals.${value}`) }));

  useEffect(() => {
    if (plan) {
      const metadata = plan.metadata ?? {};
      const rawPermissions = metadata.permissions;
      const permissions =
        typeof rawPermissions === "string"
          ? rawPermissions
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          : Array.isArray(rawPermissions)
            ? (rawPermissions as string[])
            : [];

      setForm({
        name: plan.name,
        description: plan.description ?? "",
        amount: String(planPriceCents(plan) / 100),
        interval: plan.interval,
        trialPeriodDays: plan.trialPeriodDays ? String(plan.trialPeriodDays) : "",
        features: plan.features ?? [],
        maxUsers: metadata.maxUsers ? String(metadata.maxUsers) : "",
        supportLevel: typeof metadata.supportLevel === "string" ? metadata.supportLevel : "email",
        permissions,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [plan, open]);

  const [createPlan, createState] = useMutation(CREATE_PLAN);
  const [updatePlan, updateState] = useMutation(UPDATE_PLAN);
  const loading = createState.loading || updateState.loading;

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    const amountInEuros = Number(form.amount.replace(",", "."));
    const amountInCents = Math.round(amountInEuros * 100);
    const features = form.features;
    const metadata = {
      price: amountInCents,
      maxUsers: form.maxUsers ? Number(form.maxUsers) : undefined,
      supportLevel: form.supportLevel,
      permissions: form.permissions.join(","),
    };

    if (plan) {
      const { data } = await updatePlan({
        variables: {
          plan: {
            id: plan.id,
            name: form.name,
            description: form.description || undefined,
            amount: 0,
            metadata,
            features,
          },
        },
      });
      if (data?.updatePlan?.success) {
        toast(t("updated"));
        onSaved();
        onClose();
      } else {
        toast(data?.updatePlan?.message ?? t("updateFailed"), "error");
      }
    } else {
      const { data } = await createPlan({
        variables: {
          plan: {
            name: form.name,
            description: form.description || undefined,
            amount: 0,
            metadata,
            interval: form.interval,
            trialPeriodDays: form.trialPeriodDays ? Number(form.trialPeriodDays) : undefined,
            features,
          },
        },
      });
      if (data?.createPlan?.success) {
        toast(t("created"));
        onSaved();
        onClose();
      } else {
        toast(data?.createPlan?.message ?? t("createFailed"), "error");
      }
    }
  };

  const valid = form.name && Number(form.amount.replace(",", ".")) > 0;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={plan ? t("editTitle", { name: plan.name }) : t("newPlan")}
      subtitle={plan ? t("editSubtitle") : t("createSubtitle")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!valid || loading}>
            {loading ? t("saving") : plan ? t("saveChanges") : t("createPlan")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5}>
        <Field label={t("name")}>
          <Input value={form.name} onChange={(event) => set("name")(event.target.value)} />
        </Field>
        <Field label={t("description")}>
          <Textarea value={form.description} onChange={(event) => set("description")(event.target.value)} />
        </Field>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Field label={t("price")}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(event) => set("amount")(event.target.value)}
              />
            </Field>
          </Grid>
          <Grid size={6}>
            <Field label={t("interval")}>
              <Dropdown
                options={INTERVAL_OPTIONS}
                value={form.interval}
                onChange={set("interval")}
                disabled={Boolean(plan)}
              />
            </Field>
          </Grid>
        </Grid>
        {!plan ? (
          <Field label={t("trialDays")} hint={t("optional")}>
            <Input
              type="number"
              min={0}
              value={form.trialPeriodDays}
              onChange={(event) => set("trialPeriodDays")(event.target.value)}
            />
          </Field>
        ) : null}
        <Field label={t("features")}>
          <FeatureListInput
            features={form.features}
            onChange={(features) => setForm((current) => ({ ...current, features }))}
            placeholder={t("addFeature")}
          />
        </Field>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Field label={t("maxUsers")} hint={t("maxUsersHint")}>
              <Input
                type="number"
                min={0}
                value={form.maxUsers}
                onChange={(event) => set("maxUsers")(event.target.value)}
              />
            </Field>
          </Grid>
          <Grid size={6}>
            <Field label={t("supportLevel")}>
              <Dropdown
                options={SUPPORT_LEVEL_VALUES.map((value) => ({ value, label: t(`supportLevels.${value}`) }))}
                value={form.supportLevel}
                onChange={set("supportLevel")}
              />
            </Field>
          </Grid>
        </Grid>
        <Field label={t("accessLevel")}>
          <Stack direction="row" spacing={1}>
            <Button
              type="button"
              size="sm"
              variant={
                form.permissions.length === STANDARD_PERMISSIONS.length &&
                STANDARD_PERMISSIONS.every((p) => form.permissions.includes(p))
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setForm((current) => ({ ...current, permissions: STANDARD_PERMISSIONS }))}
            >
              {t("standardPreset")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={PREMIUM_PERMISSIONS.every((p) => form.permissions.includes(p)) ? "primary" : "secondary"}
              onClick={() => setForm((current) => ({ ...current, permissions: PREMIUM_PERMISSIONS }))}
            >
              {t("premiumPreset")}
            </Button>
          </Stack>
        </Field>
        <Field label={t("permissions")} hint={t("permissionsHint")}>
          <PermissionsMatrix
            permissions={form.permissions}
            onChange={(permissions) => setForm((current) => ({ ...current, permissions }))}
            moduleLabel={(module) => t(`permissionModules.${module}`)}
            actionLabel={(action) => t(`permissionActions.${action}`)}
          />
        </Field>
      </Stack>
    </SlideOver>
  );
}
