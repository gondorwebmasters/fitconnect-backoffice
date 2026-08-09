import MuiAvatar from "@mui/material/Avatar";
import type { SxProps, Theme } from "@mui/material/styles";

const SIZE_PX: Record<"sm" | "md" | "lg" | "xl", number> = { sm: 28, md: 36, lg: 64, xl: 80 };

export function Avatar({
  name,
  url,
  size = "md",
  sx,
}: {
  name: string;
  url?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  sx?: SxProps<Theme>;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const px = SIZE_PX[size];

  return (
    <MuiAvatar
      src={url ?? undefined}
      alt={name}
      sx={{
        width: px,
        height: px,
        fontSize: size === "xl" ? 20 : size === "lg" ? 16 : size === "sm" ? 10 : 12,
        bgcolor: "primary.lighter",
        color: "primary.dark",
        ...sx,
      }}
    >
      {initials || "?"}
    </MuiAvatar>
  );
}
