import { Badge } from '@/components/ui/badge';

/**
 * StatusBadge — dark-mode-safe color system.
 *
 * Strategy: use Tailwind's semantic opacity modifiers so colors adapt to both
 * light and dark backgrounds automatically.
 *
 * Each status gets:
 *  - bg-{color}-500/15   → 15% opacity fill (visible on both dark and light bg)
 *  - text-{color}-400    → bright enough on dark, still readable on light
 *  - ring-1 ring-{color}-500/30 → subtle border that works on both themes
 *
 * This avoids the classic pitfall of bg-red-100 text-red-700 which is invisible
 * in dark mode (light bg + dark text = unreadable on dark surface).
 */

type StatusConfig = {
  bg: string;
  text: string;
  ring: string;
  dot: string;
  label?: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  // ── Green: active / available / succeeded ──────────────────────────────
  active:    { bg: 'bg-emerald-500/15', text: 'text-emerald-400 dark:text-emerald-300', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' },
  available: { bg: 'bg-emerald-500/15', text: 'text-emerald-400 dark:text-emerald-300', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' },
  succeeded: { bg: 'bg-emerald-500/15', text: 'text-emerald-400 dark:text-emerald-300', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' },

  // ── Amber: pending / premium ───────────────────────────────────────────
  pending:   { bg: 'bg-amber-500/15',   text: 'text-amber-500  dark:text-amber-300',   ring: 'ring-amber-500/30',   dot: 'bg-amber-400' },
  premium:   { bg: 'bg-amber-500/15',   text: 'text-amber-500  dark:text-amber-300',   ring: 'ring-amber-500/30',   dot: 'bg-amber-400' },

  // ── Blue: trialing / refunded ──────────────────────────────────────────
  trialing:  { bg: 'bg-blue-500/15',    text: 'text-blue-400   dark:text-blue-300',    ring: 'ring-blue-500/30',    dot: 'bg-blue-400' },
  refunded:  { bg: 'bg-blue-500/15',    text: 'text-blue-400   dark:text-blue-300',    ring: 'ring-blue-500/30',    dot: 'bg-blue-400' },

  // ── Red: cancelled / canceled / failed / past_due / unpaid ────────────
  cancelled: { bg: 'bg-rose-500/15',    text: 'text-rose-400   dark:text-rose-300',    ring: 'ring-rose-500/30',    dot: 'bg-rose-400' },
  canceled:  { bg: 'bg-rose-500/15',    text: 'text-rose-400   dark:text-rose-300',    ring: 'ring-rose-500/30',    dot: 'bg-rose-400' },
  failed:    { bg: 'bg-rose-500/15',    text: 'text-rose-400   dark:text-rose-300',    ring: 'ring-rose-500/30',    dot: 'bg-rose-400' },
  past_due:  { bg: 'bg-rose-500/15',    text: 'text-rose-400   dark:text-rose-300',    ring: 'ring-rose-500/30',    dot: 'bg-rose-400', label: 'Past Due' },
  unpaid:    { bg: 'bg-rose-500/15',    text: 'text-rose-400   dark:text-rose-300',    ring: 'ring-rose-500/30',    dot: 'bg-rose-400' },

  // ── Violet: full ───────────────────────────────────────────────────────
  full:      { bg: 'bg-violet-500/15',  text: 'text-violet-400 dark:text-violet-300',  ring: 'ring-violet-500/30',  dot: 'bg-violet-400' },

  // ── Orange: paused ────────────────────────────────────────────────────
  paused:    { bg: 'bg-orange-500/15',  text: 'text-orange-400 dark:text-orange-300',  ring: 'ring-orange-500/30',  dot: 'bg-orange-400' },

  // ── Slate: inactive / archived / expired / standard ───────────────────
  inactive:  { bg: 'bg-slate-500/15',   text: 'text-slate-400  dark:text-slate-300',   ring: 'ring-slate-500/30',   dot: 'bg-slate-400' },
  archived:  { bg: 'bg-slate-500/15',   text: 'text-slate-400  dark:text-slate-300',   ring: 'ring-slate-500/30',   dot: 'bg-slate-400' },
  expired:   { bg: 'bg-slate-500/15',   text: 'text-slate-400  dark:text-slate-300',   ring: 'ring-slate-500/30',   dot: 'bg-slate-400' },
  standard:  { bg: 'bg-slate-500/15',   text: 'text-slate-400  dark:text-slate-300',   ring: 'ring-slate-500/30',   dot: 'bg-slate-400' },

  // ── Indigo: boss ──────────────────────────────────────────────────────
  boss:      { bg: 'bg-indigo-500/15',  text: 'text-indigo-400 dark:text-indigo-300',  ring: 'ring-indigo-500/30',  dot: 'bg-indigo-400' },

  // ── Teal: coach ───────────────────────────────────────────────────────
  coach:     { bg: 'bg-teal-500/15',    text: 'text-teal-400   dark:text-teal-300',    ring: 'ring-teal-500/30',    dot: 'bg-teal-400' },
};

/** Human-readable labels for multi-word statuses */
const STATUS_LABELS: Record<string, string> = {
  past_due:  'Past Due',
  cancelled: 'Cancelado',
  canceled:  'Cancelado',
  active:    'Activo',
  inactive:  'Inactivo',
  available: 'Disponible',
  pending:   'Pendiente',
  failed:    'Fallido',
  archived:  'Archivado',
  expired:   'Expirado',
  refunded:  'Reembolsado',
  trialing:  'Prueba',
  paused:    'Pausado',
  full:      'Lleno',
  succeeded: 'Completado',
  unpaid:    'Sin pagar',
  boss:      'Boss',
  coach:     'Coach',
  premium:   'Premium',
  standard:  'Estándar',
};

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className = '', showDot = true }: StatusBadgeProps) {
  if (!status) return null;

  const key = status.toLowerCase();
  const config = STATUS_MAP[key];
  const label = STATUS_LABELS[key] ?? status.replace(/_/g, ' ');

  if (!config) {
    // Fallback for unknown statuses — neutral outline
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ring-border bg-muted/50 text-muted-foreground ${className}`}>
        {label}
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
        ring-1 ring-inset
        ${config.bg} ${config.text} ${config.ring}
        ${className}
      `}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}
