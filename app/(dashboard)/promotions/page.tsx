"use client";
import { Iconify } from "@/components/iconify";

import { useMutation, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PromotionForm } from "@/components/promotions/promotion-form";
import { BadgeDot } from "@/components/ui/badge-dot";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { PageShell } from "@/components/ui/sticky-header";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/format";
import { DELETE_PROMOTION, LIST_PROMOTIONS } from "@/lib/graphql/promotions";
import type { Promotion } from "@/lib/graphql/types";

function formatEuros(amount: number): string {
  return `${amount.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function isExpired(promotion: Promotion): boolean {
  return new Date(promotion.expiresAt).getTime() <= Date.now();
}

const PAGE_SIZE = 10;

export default function PromotionsPage() {
  const t = useTranslations("promotions");
  const toast = useToast();
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Promotion | null>(null);
  const [page, setPage] = useState(0);

  const { data, loading, refetch } = useQuery<{ getCompanyPromotions: { promotions: Promotion[] | null } }>(
    LIST_PROMOTIONS,
    { variables: { includeInactive: true } }
  );
  const [deletePromotion, deleteState] = useMutation(DELETE_PROMOTION);

  const allPromotions = data?.getCompanyPromotions?.promotions ?? [];
  const pageCount = Math.max(Math.ceil(allPromotions.length / PAGE_SIZE), 1);
  const promotions = allPromotions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleting) return;
    const { data: result } = await deletePromotion({ variables: { id: deleting.id } });
    if (result?.deletePromotion?.success) {
      toast(t("deleted"));
      refetch();
    } else {
      toast(result?.deletePromotion?.message ?? t("deleteFailed"), "error");
    }
    setDeleting(null);
  };

  const columns: Column<Promotion>[] = [
    {
      key: "title",
      header: t("columns.promotion"),
      render: (promo) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          {promo.isHero ? <Iconify icon="solar:star-bold" width={14} color="var(--palette-warning-main)" /> : null}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {promo.title}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", maxWidth: 320 }} noWrap>
              {promo.description}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: "discount",
      header: t("columns.discount"),
      render: (promo) => <Chip size="small" variant="soft" color="default" label={promo.discountTag} />,
    },
    {
      key: "pricing",
      header: t("columns.price"),
      render: (promo) => (
        <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
          <Typography component="span" variant="body2" sx={{ color: "text.disabled", textDecoration: "line-through" }}>
            {formatEuros(promo.originalPrice)}
          </Typography>
          {" → "}
          <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
            {formatEuros(promo.newPrice)}
          </Typography>
        </Typography>
      ),
    },
    {
      key: "expiresAt",
      header: t("columns.expires"),
      render: (promo) => <Typography variant="body2">{formatDateTime(promo.expiresAt)}</Typography>,
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (promo) =>
        !promo.isActive ? (
          <BadgeDot tone="muted" label={t("statusLabels.inactive")} />
        ) : isExpired(promo) ? (
          <BadgeDot tone="neutral" label={t("statusLabels.expired")} />
        ) : (
          <BadgeDot tone="positive" label={t("statusLabels.active")} />
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      render: (promo) => (
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setDeleting(promo);
          }}
          title={t("deletePromotion")}
          sx={{ color: "text.disabled", "&:hover": { color: "error.main", bgcolor: "error.lighter" } }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={15} />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      <PageShell
        header={
          <PageHeader
            title={t("title")}
            subtitle={t("subtitle")}
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Iconify icon="mingcute:add-line" width={15} />
                {t("newPromotion")}
              </Button>
            }
          />
        }
      >
        <DataTable
          columns={columns}
          rows={promotions}
          rowKey={(promo) => promo.id}
          onRowClick={(promo) => {
            setEditing(promo);
            setFormOpen(true);
          }}
          loading={loading}
          emptyMessage={t("emptyTable")}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalLabel={t("totalLabel", { count: allPromotions.length })} />
      </PageShell>

      <PromotionForm open={formOpen} promotion={editing} onClose={() => setFormOpen(false)} onSaved={() => refetch()} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t("deletePromotion")}
        description={t("deleteConfirmDescription", { title: deleting?.title ?? "" })}
        confirmLabel={t("delete")}
        danger
        loading={deleteState.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
