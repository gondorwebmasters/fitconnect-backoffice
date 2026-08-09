"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { HeroAnimation } from "@/components/layout/hero-animation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { varAlpha } from "@/theme/styles";

function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailOrNickname, setEmailOrNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrNickname, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? t("authError"));
        return;
      }
      router.push(searchParams.get("next") ?? "/");
      router.refresh();
    } catch {
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={3} sx={{ width: "100%", maxWidth: 384 }}>
      <Stack alignItems="center" spacing={0.5}>
        <HeroAnimation />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            FitConnect
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            {t("subtitle")}
          </Typography>
        </Box>
      </Stack>
      <Stack
        spacing={2}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 4,
          boxShadow: (theme) => theme.vars.customShadows.dialog,
        }}
      >
        <Field label={t("emailOrUsername")}>
          <Input
            value={emailOrNickname}
            onChange={(event) => setEmailOrNickname(event.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </Field>
        <Field label={t("password")}>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        {error ? (
          <Typography variant="body2" sx={{ color: "error.main" }}>
            {error}
          </Typography>
        ) : null}
        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading ? t("loggingIn") : t("login")}
        </Button>
      </Stack>
    </Stack>
  );
}

export default function LoginPage() {
  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        display: "flex",
        minHeight: "100dvh",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        bgcolor: "background.default",
        px: 3,
      }}
    >
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          left: -128,
          top: -128,
          height: 384,
          width: 384,
          borderRadius: "50%",
          bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.15),
          filter: "blur(64px)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          bottom: -160,
          right: -96,
          height: 384,
          width: 384,
          borderRadius: "50%",
          bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.1),
          filter: "blur(64px)",
        }}
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </Box>
  );
}
