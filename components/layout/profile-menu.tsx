"use client";

import { Iconify } from "@/components/iconify";

import { useApolloClient, useMutation } from "@apollo/client";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { fullName } from "@/lib/format";
import { SET_ACTIVE_COMPANY } from "@/lib/graphql/auth";

import { useSession } from "./session-provider";

export function ProfileMenu() {
  const { user, companies } = useSession();
  const router = useRouter();
  const client = useApolloClient();
  const t = useTranslations("profileMenu");
  const [setActiveCompany] = useMutation(SET_ACTIVE_COMPANY);
  const [switching, setSwitching] = useState<string | null>(null);

  if (!user) return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const switchCompany = async (companyId: string) => {
    if (companyId === user.activeCompanyId) return;
    setSwitching(companyId);
    await setActiveCompany({ variables: { companyId } });
    await client.resetStore();
    setSwitching(null);
  };

  return (
    <Menu
      trigger={() => (
        <Stack
          component="button"
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{
            borderRadius: 2,
            py: 0.5,
            pl: 0.5,
            pr: 1,
            transition: (theme) => theme.transitions.create("background-color"),
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Avatar size="sm" name={fullName(user)} url={user.pictureUrl?.url} />
          <Typography variant="body2" noWrap sx={{ display: { xs: "none", lg: "block" }, maxWidth: 144, color: "text.secondary" }}>
            {fullName(user)}
          </Typography>
        </Stack>
      )}
    >
      <Box sx={{ px: 2, pt: 2.5, pb: 2, textAlign: "center" }}>
        <Box
          sx={{
            display: "inline-flex",
            p: "3px",
            borderRadius: "50%",
            background: (theme) => `conic-gradient(${theme.vars.palette.primary.main}, ${theme.vars.palette.success.main}, ${theme.vars.palette.primary.main})`,
          }}
        >
          <Avatar size="lg" name={fullName(user)} url={user.pictureUrl?.url} />
        </Box>
        <Typography variant="subtitle1" sx={{ mt: 1.5 }}>
          {fullName(user)}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {user.email}
        </Typography>

        {companies.length > 1 ? (
          <Stack direction="row" spacing={-0.75} justifyContent="center" sx={{ mt: 1.5 }}>
            {companies.slice(0, 5).map((company) => (
              <Tooltip key={company.id} title={company.name}>
                <Box
                  component="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    switchCompany(company.id);
                  }}
                  disabled={switching !== null}
                  sx={{
                    position: "relative",
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: "background.paper",
                    transition: (theme) => theme.transitions.create("transform"),
                    "&:hover": { transform: "translateY(-2px)", zIndex: 1 },
                  }}
                >
                  <Avatar
                    size="sm"
                    name={company.name}
                    url={company.logo?.url}
                    sx={company.id === user.activeCompanyId ? { outline: "2px solid", outlineColor: "primary.main", outlineOffset: "1px" } : undefined}
                  />
                </Box>
              </Tooltip>
            ))}
          </Stack>
        ) : null}
      </Box>

      <MenuSeparator />

      <MenuItem icon={<Iconify icon="solar:user-rounded-bold" width={18} />} onClick={() => router.push("/profile")}>
        {t("profile")}
      </MenuItem>
      <MenuItem
        icon={<Iconify icon="solar:settings-bold-duotone" width={18} />}
        onClick={() => router.push("/settings")}
      >
        {t("settings")}
      </MenuItem>

      <Box sx={{ p: 1.5, pt: 1 }}>
        <Button variant="danger" fullWidth onClick={handleLogout}>
          <Iconify icon="solar:logout-2-bold" width={16} />
          {t("logout")}
        </Button>
      </Box>
    </Menu>
  );
}
