import type { Transition, Variants } from "framer-motion";

/**
 * Tokens de movimiento del backoffice (arquetipo "Corporate" + física Apple).
 *
 * - Un solo easing de firma para el 80 % de las animaciones.
 * - Springs críticamente amortiguados (sin rebote) por defecto; el rebote
 *   solo se usa cuando el gesto trae inercia (arrastre, flick).
 * - Salida más corta que entrada (~65 %): la UI responde antes de lo que aparece.
 */

/** cubic-bezier de firma: arranque rápido, aterrizaje suave (≈ easeOutExpo suave). */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Salidas: arranque suave, cierre veloz. */
export const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];
/** Cambios de estado en pantalla (ambos extremos suaves). */
export const EASE_IN_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];

/** Paleta de duraciones (s): quick / standard / slow. */
export const DURATION = {
  instant: 0.1,
  quick: 0.15,
  standard: 0.25,
  slow: 0.4,
} as const;

/** Spring por defecto: damping ratio 1.0 → sin rebote, respuesta ~0.4 s. */
export const SPRING: Transition = { type: "spring", stiffness: 380, damping: 38, mass: 1 };
/** Spring rápido para feedback de pulsación / hover. */
export const SPRING_SNAPPY: Transition = { type: "spring", stiffness: 520, damping: 36, mass: 0.8 };
/** Spring con un punto de rebote: solo tras gestos con inercia (drawers, flick). */
export const SPRING_MOMENTUM: Transition = { type: "spring", stiffness: 320, damping: 26, mass: 1 };

/** Retardo entre elementos de una cascada (s). Presupuesto total < 0.5 s. */
export const STAGGER = 0.045;
export const STAGGER_MAX_TOTAL = 0.4;

/** Retardo de la posición `index` en una cascada, acotado al presupuesto total. */
export function staggerDelay(index: number, step: number = STAGGER): number {
  return Math.min(index * step, STAGGER_MAX_TOTAL);
}

/** Entrada estándar: sube 12 px y aparece. Solo opacity + transform. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
  exit: { opacity: 0, y: 4, transition: { duration: DURATION.quick, ease: EASE_IN } },
};

/** Solo opacity (contenedores que NO deben recibir `transform`). */
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.standard, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: DURATION.quick, ease: EASE_IN } },
};

/** Contenedor que orquesta la cascada de hijos con `fadeUp`. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.04 } },
};

/** Feedback de pulsación: instantáneo (pointer-down), nunca al soltar. */
export const pressable = {
  whileTap: { scale: 0.97 },
  transition: SPRING_SNAPPY,
} as const;

/** Elevación de tarjeta interactiva: sube 2 px, sin cambiar layout. */
export const liftOnHover = {
  whileHover: { y: -2 },
  whileTap: { y: 0, scale: 0.995 },
  transition: SPRING,
} as const;
