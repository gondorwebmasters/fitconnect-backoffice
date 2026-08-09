import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

interface HtmlBarChartProps {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}

/** Espejo DOM/CSS de `PdfBarChart`, usado solo para la vista previa inline. */
export function HtmlBarChart({ data, formatValue }: HtmlBarChartProps) {
  const max = Math.max(1, ...data.map((item) => item.value));
  const format = formatValue ?? ((value: number) => String(value));

  return (
    <Stack spacing={0.75}>
      {data.map((item) => (
        <Stack key={item.label} direction="row" alignItems="center" spacing={1}>
          <Box component="span" sx={{ width: 64, flexShrink: 0, fontSize: 10, color: "#71717a" }}>
            {item.label}
          </Box>
          <Box sx={{ height: 10, flex: 1, overflow: "hidden", borderRadius: 999, bgcolor: "#f4f4f5" }}>
            <Box
              sx={{
                height: "100%",
                borderRadius: 999,
                bgcolor: "primary.main",
                transition: (theme) => theme.transitions.create("width", { duration: 300 }),
                width: `${(item.value / max) * 100}%`,
              }}
            />
          </Box>
          <Box component="span" sx={{ width: 44, flexShrink: 0, textAlign: "right", fontSize: 10, fontVariantNumeric: "tabular-nums", color: "#18181b" }}>
            {format(item.value)}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
