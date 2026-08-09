"use client";
import { Iconify } from "@/components/iconify";

import { useMutation } from "@apollo/client";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { useSession } from "@/components/layout/session-provider";
import { Avatar } from "@/components/ui/avatar";
import { useImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/components/ui/toast";
import { fullName } from "@/lib/format";
import { UPDATE_USER_PICTURE } from "@/lib/graphql/users";
import type { User } from "@/lib/graphql/types";

export function AvatarUpload({ user }: { user: User }) {
  const t = useTranslations("profile.avatarUpload");
  const toast = useToast();
  const { refetch } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload();
  const [updatePicture, { loading: saving }] = useMutation(UPDATE_USER_PICTURE);

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
      const { data } = await updatePicture({ variables: { picture: key, userId: user.id } });
      if (data?.updateUserPicture?.success) {
        toast(t("updated"));
        refetch();
      } else {
        toast(data?.updateUserPicture?.message ?? t("updateFailed"), "error");
      }
    } catch {
      toast(t("updateFailed"), "error");
    }
  };

  return (
    <Box sx={{ position: "relative", borderRadius: "50%", bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", p: 0.5, "&:hover .avatar-overlay": { opacity: 1 } }}>
      <Avatar size="xl" name={fullName(user)} url={user.pictureUrl?.url} />
      <ButtonBase
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={t("changePicture")}
        className="avatar-overlay"
        sx={{
          position: "absolute",
          inset: 4,
          borderRadius: "50%",
          bgcolor: "rgba(15, 23, 42, 0.5)",
          opacity: busy ? 1 : 0,
          transition: (theme) => theme.transitions.create("opacity"),
          "&:focus-visible": { opacity: 1 },
        }}
      >
        {busy ? (
          <Iconify icon="svg-spinners:180-ring" width={20} sx={{ color: "common.white" }} />
        ) : (
          <Iconify icon="solar:camera-bold" width={20} color="white" />
        )}
      </ButtonBase>
      <Box
        component="input"
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFile}
        sx={{ display: "none" }}
      />
    </Box>
  );
}
