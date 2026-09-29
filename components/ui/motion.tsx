"use client";

import { MotionConfig, motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import { EASE_OUT, fadeUp, staggerContainer, staggerDelay } from "@/lib/motion";

/**
 * Raíz de movimiento de la app. `reducedMotion="user"` hace que Framer Motion
 * respete `prefers-reduced-motion`: se eliminan los desplazamientos y escalas
 * (transform) pero se conservan los cambios de opacidad/color que ayudan a
 * entender la interfaz — el equivalente "cross-fade" recomendado.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.25, ease: EASE_OUT }}>
      {children}
    </MotionConfig>
  );
}

/**
 * Aparece subiendo ligeramente. `index` escalona la entrada respetando el
 * presupuesto total de cascada (< 0.4 s).
 *
 * OJO: al terminar, Framer deja `transform: none`, así que los overlays
 * `position: fixed` descendientes (SlideOver, diálogos) no quedan atrapados.
 */
export function Reveal({
  index = 0,
  delay,
  children,
  ...rest
}: { index?: number; delay?: number; children: ReactNode } & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ delay: delay ?? staggerDelay(index) }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Contenedor de cascada: sus `StaggerItem` entran uno tras otro. */
export function Stagger({ children, ...rest }: { children: ReactNode } & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} {...rest}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...rest }: { children: ReactNode } & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  );
}
