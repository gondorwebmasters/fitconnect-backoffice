"use client";
import { Iconify } from "@/components/iconify";

import { useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CreateCompanyForm, EditCompanyForm } from "@/components/system/company-form";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/sticky-header";
import { SlideOver } from "@/components/ui/slide-over";
import { GET_COMPANIES } from "@/lib/graphql/companies";
import type { Company } from "@/lib/graphql/types";

export default function SystemCompaniesPage() {
  const t = useTranslations("system.companies");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  // getCompanies pagina 1-based con páginas de 10 (company.service.ts)
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Company | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, loading, refetch } = useQuery<{ getCompanies: { companies: Company[] | null } }>(GET_COMPANIES, {
    variables: { page, query: query || undefined },
  });

  const companies = data?.getCompanies?.companies ?? [];

  const columns: Column<Company>[] = [
    {
      key: "company",
      header: t("columns.company"),
      render: (company) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar size="sm" name={company.name} url={company.logo?.url} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {company.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              {company.email}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    { key: "phone", header: t("columns.phone"), render: (company) => <Typography variant="body2">{company.phoneNumber ?? "—"}</Typography> },
    { key: "address", header: t("columns.address"), render: (company) => <Typography variant="body2">{company.address ?? "—"}</Typography> },
    {
      key: "code",
      header: t("columns.code"),
      render: (company) => (
        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
          {company.code ?? "—"}
        </Typography>
      ),
    },
  ];

  return (
    <>
      <PageShell
        header={
          <>
            <PageHeader
              title={t("title")}
              subtitle={t("subtitle")}
              actions={
                <Button variant="primary" onClick={() => setCreating(true)}>
                  <Iconify icon="mingcute:add-line" width={15} />
                  {t("newCompany")}
                </Button>
              }
            />

            <Box sx={{ position: "relative", width: 288, mb: 3 }}>
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{ input: { startAdornment: <Iconify icon="eva:search-fill" width={15} /> } }}
              />
            </Box>
          </>
        }
      >
        <DataTable
          columns={columns}
          rows={companies}
          rowKey={(company) => company.id}
          onRowClick={setSelected}
          loading={loading}
          emptyMessage={t("emptyTable")}
        />

        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {t("pageLabel", { page })}
          </Typography>
          <IconButton size="small" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            <Iconify icon="eva:arrow-ios-back-fill" width={22} />
          </IconButton>
          <IconButton size="small" disabled={companies.length < 10} onClick={() => setPage((value) => value + 1)}>
            <Iconify icon="eva:arrow-ios-forward-fill" width={22} />
          </IconButton>
        </Stack>
      </PageShell>

      <SlideOver open={creating} onClose={() => setCreating(false)} title={t("newCompany")} subtitle={t("newCompanySubtitle")}>
        <CreateCompanyForm
          onDone={() => {
            setCreating(false);
            refetch();
          }}
        />
      </SlideOver>

      <SlideOver
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.email}
      >
        {selected ? (
          <EditCompanyForm
            key={selected.id}
            company={selected}
            onDone={() => {
              setSelected(null);
              refetch();
            }}
          />
        ) : null}
      </SlideOver>
    </>
  );
}
