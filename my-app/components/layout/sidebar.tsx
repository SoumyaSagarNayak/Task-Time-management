"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/lib/navigation";
import { Sparkles, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { api } from "@/lib/api";

export function Sidebar() {
  const pathname = usePathname();
  const { getToken } = useAuth();
  const { user } = useUser();

  // Get current user info to check role
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get("/users/me", {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    },
    enabled: !!user,
  });

  const navItems = [...navigationItems];

  return (
    <div className="hidden md:flex h-full w-72 flex-col border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm transition-colors duration-300">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/70 dark:border-slate-800 px-6">
        <Sparkles className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">TimeTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 border border-transparent",
                isActive
                  ? 'bg-gradient-to-r from-sky-50 to-sky-100 text-sky-700 shadow-sm border-sky-200 dark:from-slate-900 dark:to-slate-950 dark:text-sky-300 dark:border-slate-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-sky-300'
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-colors duration-200", isActive ? "text-sky-600" : "text-slate-400 group-hover:text-sky-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <SignOutButton>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
