"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

import { EASE_OUT } from "@/lib/motion";

/** Cuenta ascendente/descendente animada para valores numéricos de KPIs. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest).toLocaleString("es-ES"));
  const spanRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT });
    return controls.stop;
  }, [value, motionValue, reduceMotion]);

  useEffect(() => rounded.on("change", (latest) => {
    if (spanRef.current) spanRef.current.textContent = latest;
  }), [rounded]);

  return <span ref={spanRef} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>0</span>;
}
