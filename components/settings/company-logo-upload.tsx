"use client";
import { Iconify } from "@/components/iconify";

import { useMutation } from "@apollo/client";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/components/ui/toast";
import { UPDATE_COMPANY_LOGO } from "@/lib/graphql/companies";
import type { Company } from "@/lib/graphql/types";

export function CompanyLogoUpload({ company }: { company: Company }) {
  const t = useTranslations("settings.companyLogoUpload");
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload();
  const [updateLogo, { loading: saving }] = useMutation(UPDATE_COMPANY_LOGO);

  const busy = uploading || saving;

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const key = await upload(file);
    if (!key) {
      toast(t("uploadFailed"), "error");
      return;
    }
    try {
      const { data } = await updateLogo({ variables: { companyId: company.id, picture: key } });
      if (data?.updateCompanyLogo?.success) {
        toast(t("updated"));
      } else {
        toast(data?.updateCompanyLogo?.message ?? t("updateFailed"), "error");
      }
    } catch {
      toast(t("updateFailed"), "error");
    }
  };

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Avatar size="xl" name={company.name} url={company.logo?.url} />
      <Stack spacing={0.75}>
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? (
            <Iconify icon="svg-spinners:180-ring" width={14} />
          ) : (
            <Iconify icon="solar:gallery-add-bold" width={14} />
          )}
          {busy ? t("uploading") : t("changeLogo")}
        </Button>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {t("hint")}
        </Typography>
      </Stack>
      <Box
        component="input"
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFile}
        sx={{ display: "none" }}
      />
    </Stack>
  );
}
