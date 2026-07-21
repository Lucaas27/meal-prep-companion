import type { LucideIcon } from 'lucide-react';
import { UtensilsCrossed, Calendar, Scale, Package, Settings } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/recipes', label: 'Recipes', icon: UtensilsCrossed },
  { to: '/planner', label: 'Planner', icon: Calendar },
  { to: '/calculator', label: 'Calculator', icon: Scale },
  { to: '/ingredients', label: 'Catalogue', icon: Package },
  { to: '/settings', label: 'Settings', icon: Settings },
];
