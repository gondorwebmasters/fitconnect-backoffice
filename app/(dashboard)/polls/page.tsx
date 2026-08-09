"use client";
import { Iconify } from "@/components/iconify";

import { useMutation, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/sticky-header";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/format";
import { CREATE_POLL, GET_ADMIN_POLLS, REMOVE_POLLS } from "@/lib/graphql/polls";
import type { Poll } from "@/lib/graphql/types";

function PollCard({ poll, onRemove }: { poll: Poll; onRemove: () => void }) {
  const t = useTranslations("polls");
  const votes = poll.pollVotes ?? [];
  const total = votes.length;
  const ended = new Date(Number(poll.endDate) || poll.endDate) < new Date();

  return (
    <Card variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle2">{poll.title}</Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {ended ? t("ended") : t("open")} · {t("until", { date: formatDate(poll.endDate) })} ·{" "}
            {t("voteCount", { count: total })}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onRemove}
          title={t("deletePoll")}
          sx={{ color: "text.disabled", "&:hover": { color: "error.main", bgcolor: "error.lighter" } }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={15} />
        </IconButton>
      </Stack>
      <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
        {poll.options.map((option) => {
          const count = votes.filter((vote) => vote.optionSelected === option).length;
          const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
          return (
            <Box component="li" key={option} title={t("optionTitle", { option, count, percentage })}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {option}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled", fontVariantNumeric: "tabular-nums" }}>
                  {count} · {percentage}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{ height: 6, borderRadius: 999, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { borderRadius: 999 } }}
              />
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

export default function PollsPage() {
  const t = useTranslations("polls");
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Poll | null>(null);
  const [form, setForm] = useState({ title: "", options: "", endDate: "" });

  const { data, loading, refetch } = useQuery<{ getAdminPolls: { polls: Poll[] | null } }>(GET_ADMIN_POLLS);
  const [createPoll, createState] = useMutation(CREATE_POLL);
  const [removePolls, removeState] = useMutation(REMOVE_POLLS);

  const polls = data?.getAdminPolls?.polls ?? [];

  const options = form.options
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const handleCreate = async () => {
    const { data: result } = await createPoll({
      variables: { poll: { title: form.title, options, endDate: form.endDate } },
    });
    if (result?.createPoll?.success) {
      toast(t("created"));
      setForm({ title: "", options: "", endDate: "" });
      setCreating(false);
      refetch();
    } else {
      toast(result?.createPoll?.message ?? t("createFailed"), "error");
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    const { data: result } = await removePolls({ variables: { ids: [removing.id] } });
    if (result?.removePolls?.success) {
      toast(t("removed"));
      refetch();
    } else {
      toast(result?.removePolls?.message ?? t("removeFailed"), "error");
    }
    setRemoving(null);
  };

  return (
    <>
      <PageShell
        header={
          <PageHeader
            title={t("title")}
            subtitle={t("subtitle")}
            actions={
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Iconify icon="mingcute:add-line" width={15} />
                {t("newPoll")}
              </Button>
            }
          />
        }
      >
        {loading && polls.length === 0 ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          </Grid>
        ) : polls.length === 0 ? (
          <Box sx={{ borderRadius: 2, border: 1, borderStyle: "dashed", borderColor: "divider", py: 8, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              {t("emptyState")}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {polls.map((poll) => (
              <Grid key={poll.id} size={{ xs: 12, lg: 6 }}>
                <PollCard poll={poll} onRemove={() => setRemoving(poll)} />
              </Grid>
            ))}
          </Grid>
        )}
      </PageShell>

      <SlideOver
        open={creating}
        onClose={() => setCreating(false)}
        title={t("newPoll")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={createState.loading || !form.title || options.length < 2 || !form.endDate}
            >
              {createState.loading ? t("creating") : t("publish")}
            </Button>
          </>
        }
      >
        <Stack spacing={2.5}>
          <Field label={t("question")}>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label={t("options")} hint={t("optionsHint")}>
            <Textarea
              rows={4}
              value={form.options}
              onChange={(event) => setForm({ ...form, options: event.target.value })}
            />
          </Field>
          <Field label={t("closingDate")}>
            <DatePicker
              value={form.endDate}
              onChange={(value) => setForm({ ...form, endDate: value })}
            />
          </Field>
        </Stack>
      </SlideOver>

      <ConfirmDialog
        open={Boolean(removing)}
        title={t("deletePoll")}
        description={t("deleteConfirmDescription", { title: removing?.title ?? "" })}
        confirmLabel={t("delete")}
        danger
        loading={removeState.loading}
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
