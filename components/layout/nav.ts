export interface NavItem {
  href: string;
  labelKey: string;
  icon: string;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: "solar:widget-5-bold" },
  { href: "/members", labelKey: "members", icon: "solar:users-group-rounded-bold" },
  { href: "/calendar", labelKey: "calendar", icon: "solar:calendar-bold" },
  { href: "/plans", labelKey: "plans", icon: "solar:checklist-minimalistic-bold" },
  { href: "/subscriptions", labelKey: "subscriptions", icon: "solar:card-bold" },
  { href: "/billing", labelKey: "billing", icon: "solar:bill-list-bold" },
  { href: "/products", labelKey: "products", icon: "solar:box-bold" },
  { href: "/promotions", labelKey: "promotions", icon: "solar:tag-price-bold" },
  { href: "/polls", labelKey: "polls", icon: "solar:chart-2-bold" },
  { href: "/broadcast", labelKey: "broadcast", icon: "solar:bell-bing-bold-duotone" },
  { href: "/reports", labelKey: "reports", icon: "solar:document-text-bold" },
  { href: "/settings", labelKey: "settings", icon: "solar:settings-bold-duotone" },
];

export const SYSTEM_NAV: NavItem[] = [
  { href: "/system", labelKey: "overview", icon: "solar:chart-2-bold" },
  { href: "/system/companies", labelKey: "companies", icon: "solar:buildings-2-bold" },
];

/** Claves de traducción (namespace "nav.segments") por segmento de ruta para las migas de pan. */
export const SEGMENT_LABEL_KEYS: Record<string, string> = {
  members: "members",
  calendar: "calendar",
  plans: "plans",
  subscriptions: "subscriptions",
  billing: "billing",
  products: "products",
  promotions: "promotions",
  polls: "polls",
  broadcast: "broadcast",
  reports: "reports",
  settings: "settings",
  system: "system",
  companies: "companies",
  profile: "profile",
  finance: "finance",
  onboarding: "onboarding",
  danger: "danger",
};