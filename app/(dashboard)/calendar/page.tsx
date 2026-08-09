"use client";

import { Iconify } from "@/components/iconify";

import { useTranslations } from "next-intl";
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
            <Button variant="primary" onClick={() => calendarRef.current?.openCreateForm()}>
              <Iconify icon="mingcute:add-line" width={15} />
              {t("newClass")}
            </Button>
          }
        />
      }
    >
      <CalendarView ref={calendarRef} />
    </PageShell>
  );
}
