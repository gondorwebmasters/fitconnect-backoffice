"use client";

import { useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import type { CSSProperties } from "react";

import { stylesMode, varAlpha } from "@/theme/styles";
import { GET_ACTIVE_COMPANY_LOGO } from "@/lib/graphql/companies";

import { useSession } from "./session-provider";

type CompanyLogoData = {
  getCompanies: { success: boolean; company: { id: string; logo?: { url: string } | null } | null } | null;
};

// Máscara radial: funde los cuatro bordes de la imagen a transparente en vez
// de dejar el rectángulo recortado a la vista — así se percibe como parte
// del fondo, no como una foto pegada encima.
const LOGO_MASK: CSSProperties = {
  maskImage: "radial-gradient(ellipse 55% 60% at 50% 50%, black 35%, transparent 78%)",
  WebkitMaskImage: "radial-gradient(ellipse 55% 60% at 50% 50%, black 35%, transparent 78%)",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

/**
 * Fondo decorativo del layout: el logo de la empresa activa, a tamaño
 * completo y muy translúcido, pegado al borde derecho, con luces suaves de
 * color detrás. Vive por debajo de sidebar/topbar/tarjetas (todas opacas),
 * así que solo asoma en los huecos del fondo de página — nunca compite con
 * el contenido ni con el contraste de texto.
 */
export function CompanyBackdrop() {
  const { user } = useSession();
  const { data } = useQuery<CompanyLogoData>(GET_ACTIVE_COMPANY_LOGO, {
    variables: { companyId: user?.activeCompanyId },
    skip: !user?.activeCompanyId,
  });

  const logoUrl = data?.getCompanies?.company?.logo?.url;
  if (!logoUrl) return null;

  return (
    <Box sx={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }} aria-hidden>
      <Box
        sx={{
          position: "absolute",
          right: -160,
          top: -160,
          height: 544,
          width: 544,
          borderRadius: "50%",
          bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.25),
          filter: "blur(120px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: -64,
          top: "33%",
          height: 416,
          width: 416,
          borderRadius: "50%",
          bgcolor: (theme) => varAlpha(theme.vars.palette.success.mainChannel, 0.15),
          filter: "blur(110px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: -112,
          bottom: 0,
          height: 448,
          width: 448,
          borderRadius: "50%",
          bgcolor: (theme) => varAlpha(theme.vars.palette.warning.mainChannel, 0.15),
          filter: "blur(110px)",
        }}
      />
      <Box
        component="img"
        src={logoUrl}
        alt=""
        style={LOGO_MASK}
        sx={{
          position: "absolute",
          right: "-6%",
          top: "50%",
          height: "85vh",
          width: "auto",
          transform: "translateY(-50%)",
          objectFit: "contain",
          opacity: 0.09,
          filter: "blur(1px)",
          [stylesMode.dark]: { opacity: 0.07 },
        }}
      />
      {/* Refuerza la fusión con el fondo por si el logo tiene su propio recuadro/color sólido */}
      <Box
        sx={{
          position: "absolute",
          inset: "0 0 0 auto",
          right: 0,
          width: "50%",
          background: (theme) => `linear-gradient(to left, transparent, transparent, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.8)})`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: "33%",
          background: (theme) => `linear-gradient(to bottom, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.7)}, transparent)`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          height: "33%",
          background: (theme) => `linear-gradient(to top, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.7)}, transparent)`,
        }}
      />
    </Box>
  );
}
