"use client";

import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { varAlpha } from "@/theme/styles";
import { PDFViewer, type DocumentProps } from "@react-pdf/renderer";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, type ReactElement } from "react";

interface ReportLightboxProps {
  open: boolean;
  onClose: () => void;
  document: ReactElement<DocumentProps>;
}

export function ReportLightbox({ open, onClose, document }: ReportLightboxProps) {
  const t = useTranslations("reports.lightbox");
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <Box sx={{ position: "fixed", inset: 0, zIndex: (theme) => theme.zIndex.modal, display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 3, md: 5 } }}>
          <Box
            component={motion.div}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            sx={{ position: "absolute", inset: 0, bgcolor: (theme) => varAlpha(theme.vars.palette.grey["900Channel"], 0.6) }}
          />
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            sx={{
              position: "relative",
              display: "flex",
              height: "100%",
              width: "100%",
              maxWidth: 896,
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: 4,
              bgcolor: "background.paper",
              boxShadow: (theme) => theme.vars.customShadows.dialog,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2.5, py: 1.5 }}>
              <Typography variant="subtitle2">{t("fullPreview")}</Typography>
              <IconButton onClick={onClose} aria-label={t("closePreview")} sx={{ color: "text.disabled" }}>
                <Iconify icon="mingcute:close-line" width={18} />
              </IconButton>
            </Stack>
            <Box sx={{ flex: 1, bgcolor: "background.neutral" }}>
              <PDFViewer width="100%" height="100%" showToolbar style={{ border: "none" }}>
                {document}
              </PDFViewer>
            </Box>
          </Box>
        </Box>
      ) : null}
    </AnimatePresence>
  );
}
