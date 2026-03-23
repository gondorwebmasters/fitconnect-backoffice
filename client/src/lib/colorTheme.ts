/**
 * Dynamic color theming utility.
 * Converts a HEX color to OKLCH and applies it to all relevant CSS variables
 * so the entire app updates instantly without a page reload.
 */

// ── HEX → linear RGB ────────────────────────────────────────────────────────
function hexToLinearRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return [toLinear(r), toLinear(g), toLinear(b)];
}

// ── linear RGB → XYZ D65 ────────────────────────────────────────────────────
function linearRgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
  return [x, y, z];
}

// ── XYZ D65 → OKLab ─────────────────────────────────────────────────────────
function xyzToOklab(x: number, y: number, z: number): [number, number, number] {
  const l = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

// ── OKLab → OKLCH ───────────────────────────────────────────────────────────
function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  let H = Math.atan2(b, a) * (180 / Math.PI);
  if (H < 0) H += 360;
  return [L, C, H];
}

// ── Main: HEX → OKLCH string ─────────────────────────────────────────────────
export function hexToOklch(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return hex;
  try {
    const [lr, lg, lb] = hexToLinearRgb(hex);
    const [x, y, z] = linearRgbToXyz(lr, lg, lb);
    const [L, a, b] = xyzToOklab(x, y, z);
    const [Lf, C, H] = oklabToOklch(L, a, b);
    return `oklch(${Lf.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(3)})`;
  } catch {
    return hex;
  }
}

// ── Determine if a color is "light" (for foreground contrast) ────────────────
function hexToRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToLinearRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getForegroundForColor(hex: string): string {
  const lum = hexToRelativeLuminance(hex);
  // White foreground for dark colors, dark foreground for light colors
  return lum > 0.35 ? 'oklch(0.15 0 0)' : 'oklch(1 0 0)';
}

// ── Apply primary color to all relevant CSS variables ────────────────────────
export function applyPrimaryColor(hex: string): void {
  if (!hex || !hex.startsWith('#')) return;
  const oklch = hexToOklch(hex);
  const fg = getForegroundForColor(hex);
  const root = document.documentElement;

  // Core primary
  root.style.setProperty('--primary', oklch);
  root.style.setProperty('--primary-foreground', fg);

  // Ring (focus outline)
  root.style.setProperty('--ring', oklch);

  // Sidebar primary
  root.style.setProperty('--sidebar-primary', oklch);
  root.style.setProperty('--sidebar-primary-foreground', fg);
  root.style.setProperty('--sidebar-ring', oklch);

  // Chart-1 (main chart color)
  root.style.setProperty('--chart-1', oklch);
}

// ── Persist and load from localStorage ───────────────────────────────────────
const STORAGE_KEY = 'fitconnect_primary_color';

export function savePrimaryColor(companyId: string, hex: string): void {
  localStorage.setItem(`${STORAGE_KEY}_${companyId}`, hex);
}

export function loadPrimaryColor(companyId: string): string | null {
  return localStorage.getItem(`${STORAGE_KEY}_${companyId}`);
}

export function removePrimaryColor(companyId: string): void {
  localStorage.removeItem(`${STORAGE_KEY}_${companyId}`);
}
