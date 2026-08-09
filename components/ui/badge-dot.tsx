import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Tone = "positive" | "neutral" | "warning" | "negative" | "muted";

const TONE_COLOR: Record<Tone, string> = {
  positive: "success.main",
  neutral: "text.disabled",
  warning: "warning.main",
  negative: "error.main",
  muted: "grey.400",
};

export function BadgeDot({ tone = "neutral", label }: { tone?: Tone; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ display: "inline-flex" }}>
      <Stack sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: TONE_COLOR[tone] }} />
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}
