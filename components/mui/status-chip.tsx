import { Label } from "@/components/label";
import type { LabelColor } from "@/components/label";

export type StatusTone = "positive" | "neutral" | "warning" | "negative" | "muted";

const TONE_COLOR: Record<StatusTone, LabelColor> = {
  positive: "success",
  neutral: "info",
  warning: "warning",
  negative: "error",
  muted: "default",
};

/** Thin convenience wrapper over Minimals' real `Label` component, mapping
 * this app's semantic tone names to Label's color palette. */
export function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  return <Label color={TONE_COLOR[tone]}>{label}</Label>;
}
