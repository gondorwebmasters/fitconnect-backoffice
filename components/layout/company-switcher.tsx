"use client";

import { Iconify } from "@/components/iconify";

import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Popover } from "@/components/ui/popover";
import { SET_ACTIVE_COMPANY } from "@/lib/graphql/auth";
import { GET_ACTIVE_COMPANY_NAME, GET_COMPANY_OPTIONS } from "@/lib/graphql/companies";

import { useSession } from "./session-provider";

type CompanyOption = { id: string; name: string };

type CompanyOptionsData = {
  getCompanies: { success: boolean; companies: CompanyOption[] | null } | null;
};

export function CompanySwitcher() {
  const { user, companies } = useSession();
  const t = useTranslations("companySwitcher");
  const client = useApolloClient();
  const [setActiveCompany, { loading: switching }] = useMutation(SET_ACTIVE_COMPANY);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isSuperAdmin = Boolean(user?.isSuperAdmin);

  // Superadmin: todas las empresas del sistema, con búsqueda en servidor.
  // Se precarga al montar (no se espera a abrir el dropdown) para que el
  // panel no tarde en mostrar contenido, sobre todo en redes móviles lentas.
  const { data: optionsData, loading: loadingOptions } = useQuery<CompanyOptionsData>(
    GET_COMPANY_OPTIONS,
    {
      variables: { page: 1, query: search || undefined },
      skip: !isSuperAdmin,
      fetchPolicy: "cache-and-network",
    },
  );

  // La empresa activa puede no estar en me.companies (superadmin gestionando
  // una ajena): resolvemos su nombre aparte para que el trigger siempre la muestre.
  const activeInSession = companies.some((company) => company.id === user?.activeCompanyId);
  const { data: activeData } = useQuery<{
    getCompanies: { company: CompanyOption | null } | null;
  }>(GET_ACTIVE_COMPANY_NAME, {
    variables: { companyId: user?.activeCompanyId },
    skip: !user?.activeCompanyId || activeInSession,
  });

  if (!user) return null;
  if (!isSuperAdmin && companies.length < 2) return null;

  const options: CompanyOption[] = isSuperAdmin
    ? (optionsData?.getCompanies?.companies ?? [])
    : companies.filter((company) =>
        company.name.toLowerCase().includes(search.trim().toLowerCase()),
      );

  const fetchedActive = activeData?.getCompanies?.company;
  const activeCompany =
    companies.find((company) => company.id === user.activeCompanyId) ??
    (fetchedActive?.id === user.activeCompanyId ? fetchedActive : undefined) ??
    options.find((company) => company.id === user.activeCompanyId);

  const handleSelect = async (companyId: string) => {
    setOpen(false);
    setSearch("");
    if (!companyId || companyId === user.activeCompanyId) return;
    await setActiveCompany({ variables: { companyId } });
    await client.resetStore();
  };

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <Stack
          component="button"
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={() => setOpen((value) => !value)}
          disabled={switching}
          sx={{
            height: 32,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            px: { xs: 0.75, sm: 1.25 },
            fontSize: 12,
            color: "text.secondary",
            boxShadow: (theme) => theme.vars.customShadows.z1,
            transition: (theme) => theme.transitions.create(["border-color", "color"]),
            "&:hover": { borderColor: "text.disabled", color: "text.primary" },
            "&:disabled": { opacity: 0.6 },
          }}
        >
          <Iconify icon="solar:buildings-2-bold" width={13} sx={{ color: "text.disabled" }} />
          {/* Solo icono + chevron en xs: el nombre completo de la empresa se
              muestra dentro del popover al abrirlo, así que no hace falta
              reservarle sitio en el topbar cuando el espacio escasea. */}
          <Box
            component="span"
            sx={{ display: { xs: "none", sm: "block" }, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {switching ? t("switching") : (activeCompany?.name ?? t("select"))}
          </Box>
          <Iconify icon="solar:sort-vertical-linear" width={12} sx={{ color: "text.disabled" }} />
        </Stack>
      }
    >
      <Box sx={{ width: 256 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1.5 }}>
          <Iconify icon="eva:search-fill" width={13} sx={{ color: "text.disabled" }} />
          <InputBase
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            sx={{ height: 36, width: "100%", fontSize: 12 }}
          />
        </Stack>
        <List dense sx={{ maxHeight: 256, overflowY: "auto", py: 0.5 }}>
          {options.map((company) => (
            <ListItemButton
              key={company.id}
              onClick={() => handleSelect(company.id)}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1 }}
            >
              <Typography
                variant="caption"
                noWrap
                sx={{ fontWeight: company.id === user.activeCompanyId ? 600 : 400, color: company.id === user.activeCompanyId ? "text.primary" : "text.secondary" }}
              >
                {company.name}
              </Typography>
              {company.id === user.activeCompanyId ? (
                <Iconify icon="eva:checkmark-fill" width={13} sx={{ flexShrink: 0, color: "primary.main" }} />
              ) : null}
            </ListItemButton>
          ))}
          {options.length === 0 ? (
            <Typography variant="caption" sx={{ display: "block", px: 1.5, py: 3, textAlign: "center", color: "text.disabled" }}>
              {loadingOptions ? t("loading") : t("noResults")}
            </Typography>
          ) : null}
        </List>
      </Box>
    </Popover>
  );
}
