"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { SEGMENT_LABEL_KEYS } from "./nav";

function Separator() {
  return (
    <Box
      component="span"
      sx={{ display: "inline-block", height: 4, width: 4, borderRadius: "50%", bgcolor: "text.disabled", flexShrink: 0 }}
    />
  );
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const tMain = useTranslations("nav.main");
  const tSegments = useTranslations("nav.segments");
  const tSidebar = useTranslations("sidebar");

  return (
    <Stack component="nav" direction="row" alignItems="center" spacing={1} aria-label={tSidebar("breadcrumbs")} sx={{ minWidth: 0, fontSize: 14 }}>
      <Typography
        component={Link}
        href="/"
        variant="body2"
        sx={{ color: "text.secondary", transition: (theme) => theme.transitions.create("color"), "&:hover": { color: "text.primary" } }}
      >
        {tMain("dashboard")}
      </Typography>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const last = index === segments.length - 1;
        const segmentKey = SEGMENT_LABEL_KEYS[segment];
        const label = segmentKey
          ? tSegments(segmentKey)
          : segment.charAt(0).toUpperCase() + segment.slice(1);
        return (
          <Fragment key={href}>
            <Separator />
            {last ? (
              <Typography variant="body2" noWrap sx={{ color: "text.disabled" }}>
                {label}
              </Typography>
            ) : (
              <Typography
                component={Link}
                href={href}
                variant="body2"
                sx={{ color: "text.secondary", transition: (theme) => theme.transitions.create("color"), "&:hover": { color: "text.primary" } }}
              >
                {label}
              </Typography>
            )}
          </Fragment>
        );
      })}
    </Stack>
  );
}
