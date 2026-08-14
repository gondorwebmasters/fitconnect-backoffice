"use client";

import Calendar from "@fullcalendar/react";
import listPlugin from "@fullcalendar/list";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { useQuery } from "@apollo/client";
import Card from "@mui/material/Card";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { toISODate } from "@/lib/format";
import { GET_SCHEDULES_RANGE } from "@/lib/graphql/schedules";
import type { Schedule } from "@/lib/graphql/types";
import { useTheme } from "@mui/material/styles";
import { varAlpha } from "@/theme/styles";

import { ScheduleForm } from "./schedule-form";
import { SchedulePanel } from "./schedule-panel";
import { StyledCalendar } from "./styles";
import { CalendarToolbar } from "./calendar-toolbar";
import { useCalendar, type CalendarViewName } from "./use-calendar";

function initialRange(): { start: Date; end: Date } {
  const now = new Date();
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
}

export interface CalendarViewHandle {
  openCreateForm: () => void;
}

export const CalendarView = forwardRef<CalendarViewHandle>(function CalendarView(_props, ref) {
  const t = useTranslations("calendar");
  const theme = useTheme();

  const {
    calendarRef,
    view,
    date,
    range,
    onDatesSet,
    onDatePrev,
    onDateNext,
    onDateToday,
    onChangeView,
    onSelectRange,
    onClickEvent,
    openForm,
    onOpenForm,
    onCloseForm,
    selectedEventId,
    setSelectedEventId,
    selectedRange,
  } = useCalendar();

  useImperativeHandle(ref, () => ({ openCreateForm: onOpenForm }), [onOpenForm]);

  const [visibleRange, setVisibleRange] = useState(initialRange);

  useEffect(() => {
    if (range) setVisibleRange(range);
  }, [range]);

  const { data, loading, refetch } = useQuery<{ getSchedulesRange: { schedules: Schedule[] | null } }>(GET_SCHEDULES_RANGE, {
    variables: { startDate: toISODate(visibleRange.start), endDate: toISODate(visibleRange.end) },
  });

  const schedules = useMemo(() => data?.getSchedulesRange?.schedules ?? [], [data]);
  const selectedSchedule = schedules.find((schedule) => schedule.id === selectedEventId) ?? null;

  const events = useMemo(
    () =>
      schedules.map((schedule) => {
        const cancelled = schedule.state === "cancelled";
        const occupancy = schedule.maxUsers > 0 ? (schedule.users?.length ?? 0) / schedule.maxUsers : 0;

        const [background, text] = cancelled
          ? [theme.vars.palette.grey[500], theme.vars.palette.grey[700]]
          : occupancy >= 0.9
            ? [theme.vars.palette.error.main, theme.vars.palette.error.dark]
            : occupancy >= 0.5
              ? [theme.vars.palette.warning.main, theme.vars.palette.warning.dark]
              : [theme.vars.palette.success.main, theme.vars.palette.success.dark];

        return {
          id: schedule.id,
          title: schedule.title,
          start: schedule.startDate,
          end: schedule.endDate,
          backgroundColor: background,
          textColor: text,
        };
      }),
    [schedules, theme],
  );

  const labels = {
    today: t("today"),
    views: {
      dayGridMonth: t("views.month"),
      timeGridWeek: t("views.week"),
      timeGridDay: t("views.day"),
      listWeek: t("views.agenda"),
    },
  };

  const dateLabel = view === "dayGridMonth" || view === "listWeek"
    ? date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Card sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: "70vh" }}>
        <StyledCalendar sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column", ".fc.fc-media-screen": { flex: "1 1 auto" } }}>
          <CalendarToolbar
            date={dateLabel}
            view={view}
            loading={loading}
            onToday={onDateToday}
            onNextDate={onDateNext}
            onPrevDate={onDatePrev}
            onChangeView={onChangeView}
            labels={labels}
          />

          <Calendar
            weekends
            selectable
            rerenderDelay={10}
            allDayMaintainDuration
            ref={calendarRef}
            initialDate={date}
            initialView={view}
            dayMaxEventRows={3}
            eventDisplay="block"
            events={events}
            headerToolbar={false}
            select={onSelectRange}
            eventClick={onClickEvent}
            datesSet={onDatesSet}
            aspectRatio={3}
            plugins={[listPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
          />
        </StyledCalendar>
      </Card>

      <SchedulePanel
        schedule={selectedSchedule}
        onClose={() => setSelectedEventId(null)}
        onChanged={() => refetch()}
      />
      <ScheduleForm
        open={openForm}
        onClose={onCloseForm}
        onCreated={() => refetch()}
        initialDate={selectedRange?.start}
      />
    </>
  );
});

export type { CalendarViewName };
