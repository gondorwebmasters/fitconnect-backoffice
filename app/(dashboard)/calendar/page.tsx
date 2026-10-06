"use client";

import { Iconify } from "@/components/iconify";

import Stack from "@mui/material/Stack";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRef } from "react";

import { CalendarView, type CalendarViewHandle } from "@/components/calendar/calendar-view";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/sticky-header";

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const calendarRef = useRef<CalendarViewHandle>(null);

  return (
    <PageShell
      header={
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Stack direction="row" spacing={1}>
              <Button variant="ghost" component={Link} href="/calendar/templates">
                <Iconify icon="solar:repeat-bold" width={15} />
                {t("templates.title")}
              </Button>
              <Button variant="primary" onClick={() => calendarRef.current?.openCreateForm()}>
                <Iconify icon="mingcute:add-line" width={15} />
                {t("newClass")}
              </Button>
            </Stack>
          }
        />
      }
    >
      <CalendarView ref={calendarRef} />
    </PageShell>
  );
}
