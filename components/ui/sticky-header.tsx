import Box from "@mui/material/Box";
import type { ReactNode } from "react";

/**
 * Cabecera de página + contenido. La versión Tailwind fijaba el alto del
 * contenido a `100vh` menos el topbar para darle scroll propio; MUI no tiene
 * un topbar flotante equivalente, así que la página fluye con el scroll
 * normal del documento.
 */
export function PageShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <Box>
      {header}
      {children}
    </Box>
  );
}
