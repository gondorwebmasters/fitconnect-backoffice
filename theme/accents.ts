import { createPaletteChannel } from './styles';

/**
 * The 12 accent presets, as five-stop Minimals-shaped ramps
 * ({lighter,light,main,dark,darker,contrastText}). Hexes are lifted from
 * Tailwind's own palette at shades 100/400/500/700/900 for each hue — `main`
 * is byte-identical to the pre-migration single-hex accent
 * (lib/theme/palette.ts), so switching to this system does not change any
 * page's color. `light` doubles as the old `chartDarkRgb` (recharts stroke
 * color in dark mode — see theme/global-styles.tsx).
 *
 * amber/cyan contrastText is `#1C252E` (Minimals' dark-on-light convention)
 * instead of white: at those hues, white text on `main` fails WCAG AA. This
 * is a deliberate visual fix made during the migration, not a preserved
 * behavior — the old code forced white on all 12 accents.
 */
export const ACCENT_HEX = {
  indigo: {
    lighter: '#E0E7FF',
    light: '#818CF8',
    main: '#6366F1',
    dark: '#4338CA',
    darker: '#312E81',
    contrastText: '#FFFFFF',
  },
  purple: {
    lighter: '#EDE9FE',
    light: '#A78BFA',
    main: '#8B5CF6',
    dark: '#6D28D9',
    darker: '#4C1D95',
    contrastText: '#FFFFFF',
  },
  pink: {
    lighter: '#FCE7F3',
    light: '#F472B6',
    main: '#EC4899',
    dark: '#BE185D',
    darker: '#831843',
    contrastText: '#FFFFFF',
  },
  red: {
    lighter: '#FEE2E2',
    light: '#F87171',
    main: '#EF4444',
    dark: '#B91C1C',
    darker: '#7F1D1D',
    contrastText: '#FFFFFF',
  },
  orange: {
    lighter: '#FFEDD5',
    light: '#FB923C',
    main: '#F97316',
    dark: '#C2410C',
    darker: '#7C2D12',
    contrastText: '#FFFFFF',
  },
  amber: {
    lighter: '#FEF3C7',
    light: '#FBBF24',
    main: '#F59E0B',
    dark: '#B45309',
    darker: '#78350F',
    contrastText: '#1C252E',
  },
  green: {
    lighter: '#DCFCE7',
    light: '#4ADE80',
    main: '#22C55E',
    dark: '#15803D',
    darker: '#14532D',
    contrastText: '#FFFFFF',
  },
  emerald: {
    lighter: '#D1FAE5',
    light: '#34D399',
    main: '#10B981',
    dark: '#047857',
    darker: '#064E3B',
    contrastText: '#FFFFFF',
  },
  cyan: {
    lighter: '#CFFAFE',
    light: '#22D3EE',
    main: '#06B6D4',
    dark: '#0E7490',
    darker: '#164E63',
    contrastText: '#1C252E',
  },
  blue: {
    lighter: '#DBEAFE',
    light: '#60A5FA',
    main: '#3B82F6',
    dark: '#1D4ED8',
    darker: '#1E3A8A',
    contrastText: '#FFFFFF',
  },
  navy: {
    lighter: '#DBEAFE',
    light: '#3B82F6',
    main: '#1E40AF',
    dark: '#1E3A8A',
    darker: '#172554',
    contrastText: '#FFFFFF',
  },
  gray: {
    lighter: '#F3F4F6',
    light: '#9CA3AF',
    main: '#6B7280',
    dark: '#374151',
    darker: '#111827',
    contrastText: '#FFFFFF',
  },
} as const;

export type AccentId = keyof typeof ACCENT_HEX;

// Preserves the order of the pre-migration picker (lib/theme/palette.ts).
export const ACCENT_IDS: AccentId[] = [
  'indigo',
  'purple',
  'pink',
  'red',
  'orange',
  'amber',
  'green',
  'emerald',
  'cyan',
  'blue',
  'navy',
  'gray',
];

export const DEFAULT_ACCENT: AccentId = 'red';

export function isAccentId(value: string): value is AccentId {
  return (ACCENT_IDS as string[]).includes(value);
}

export function getAccentPalette(id: AccentId) {
  return createPaletteChannel(ACCENT_HEX[id] ?? ACCENT_HEX[DEFAULT_ACCENT]);
}
