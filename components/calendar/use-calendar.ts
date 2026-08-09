"use client";

import type FullCalendar from "@fullcalendar/react";
import type { DatesSetArg, DateSelectArg, EventClickArg } from "@fullcalendar/core";

import { useRef, useState, useCallback } from "react";

import { useResponsive } from "@/hooks/use-responsive";

export type CalendarViewName = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";
export type CalendarRange = { start: Date; end: Date } | null;

export function useCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const calendarEl = calendarRef.current;

  const smUp = useResponsive("up", "sm");

  const [date, setDate] = useState(new Date());
  const [range, setRange] = useState<CalendarRange>(null);
  const [view, setView] = useState<CalendarViewName>(smUp ? "dayGridMonth" : "listWeek");

  const [openForm, setOpenForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<CalendarRange>(null);

  const onOpenForm = useCallback(() => setOpenForm(true), []);
  const onCloseForm = useCallback(() => {
    setOpenForm(false);
    setSelectedRange(null);
  }, []);

  const onChangeView = useCallback(
    (newView: CalendarViewName) => {
      if (calendarEl) {
        calendarEl.getApi().changeView(newView);
        setView(newView);
      }
    },
    [calendarEl],
  );

  const onDateToday = useCallback(() => {
    if (calendarEl) {
      calendarEl.getApi().today();
      setDate(calendarEl.getApi().getDate());
    }
  }, [calendarEl]);

  const onDatePrev = useCallback(() => {
    if (calendarEl) {
      calendarEl.getApi().prev();
      setDate(calendarEl.getApi().getDate());
    }
  }, [calendarEl]);

  const onDateNext = useCallback(() => {
    if (calendarEl) {
      calendarEl.getApi().next();
      setDate(calendarEl.getApi().getDate());
    }
  }, [calendarEl]);

  // El rango visible cambia con la vista (mes/semana/día) y con prev/next —
  // se usa para pedir al servidor solo las clases del rango mostrado.
  const onDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({ start: arg.start, end: arg.end });
  }, []);

  const onSelectRange = useCallback(
    (arg: DateSelectArg) => {
      if (calendarEl) calendarEl.getApi().unselect();
      setSelectedRange({ start: arg.start, end: arg.end });
      onOpenForm();
    },
    [calendarEl, onOpenForm],
  );

  const onClickEvent = useCallback(
    (arg: EventClickArg) => {
      setSelectedEventId(arg.event.id);
    },
    [],
  );

  return {
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
  };
}
