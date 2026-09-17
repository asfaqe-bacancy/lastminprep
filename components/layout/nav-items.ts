import {
  FileText,
  Home,
  Layers,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/preparations", label: "Preparations", Icon: Layers },
  { href: "/documents", label: "Documents", Icon: FileText },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", Icon: Settings },
];

/** Mobile bottom bar. "Add" sits in the middle; "More" opens a sheet. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/preparations", label: "Prep", Icon: Layers },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
