import {
  Home,
  CheckSquare,
  Clock,
  Briefcase,
  User,
  LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Time Entries", href: "/dashboard/time-entries", icon: Clock },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];
