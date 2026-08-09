"use client";
import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import { useSession } from "@/components/layout/session-provider";
import { AppearanceCard } from "@/components/profile/appearance-card";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { Chip } from "@/components/ui/chip";
import { fullName } from "@/lib/format";
import type { UserRole } from "@/lib/graphql/types";

export default function ProfilePage() {
  const t = useTranslations("profile.page");
  const { user, loading } = useSession();

  const ROLE_LABELS: Record<UserRole, string> = {
    admin: t("roleLabels.admin"),
    coach: t("roleLabels.coach"),
    standard: t("roleLabels.standard"),
  };

  if (loading && !user) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={176} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
        </Grid>
      </Stack>
    );
  }

  if (!user) return null;

  return (
    <Stack spacing={3}>
      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 2,
          background: "linear-gradient(135deg, var(--palette-primary-main), var(--palette-primary-dark))",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: -96,
            right: -64,
            width: 256,
            height: 256,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.1)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: -112,
            right: 128,
            width: 224,
            height: 224,
            borderRadius: "50%",
            bgcolor: "rgba(0,0,0,0.1)",
            filter: "blur(64px)",
            pointerEvents: "none",
          }}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          spacing={{ xs: 2.5, sm: 3 }}
          sx={{ position: "relative", p: 4 }}
        >
          <AvatarUpload user={user} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ color: "primary.contrastText" }} noWrap>
              {fullName(user)}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5, color: "primary.contrastText" }}>
              <Iconify icon="solar:letter-bold" width={13} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "inherit" }} noWrap>
                {user.email}
              </Typography>
            </Stack>
            <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
              {user.contextRole ? (
                <Chip
                  sx={{
                    borderColor: "rgba(255,255,255,0.2)",
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "primary.contrastText",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {ROLE_LABELS[user.contextRole]}
                </Chip>
              ) : null}
              {user.isSuperAdmin ? (
                <Chip
                  sx={{
                    borderColor: "rgba(255,255,255,0.2)",
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "primary.contrastText",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="solar:verified-check-bold" width={12} />
                    {t("superadmin")}
                  </Stack>
                </Chip>
              ) : null}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Contenido */}
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 6 }}>
          <ProfileForm user={user} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={3}>
            <PasswordForm />
            <AppearanceCard />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
