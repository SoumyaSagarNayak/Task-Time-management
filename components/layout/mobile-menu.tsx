"use client";

import { useMobileMenu } from "@/hooks/useMobileMenu";
import { navigationItems } from "@/lib/navigation";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const { isOpen, close } = useMobileMenu();
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Slide-in Menu Panel */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Mobile navigation"
        aria-expanded={isOpen}
      >
        {/* Header (Logo) */}
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">TimeTrack</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

// HamburgerButton to be placed in the main header
export function HamburgerButton() {
  const { toggle, isOpen } = useMobileMenu();
  
  return (
    <button
      onClick={toggle}
      className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors lg:hidden inline-flex items-center justify-center cursor-pointer overflow-hidden z-50"
      aria-label="Toggle menu"
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
      type="button"
    >
      <div className="relative w-5 h-[14px]">
        <span className={cn("absolute left-0 w-full h-[2px] bg-current transition-all duration-300 rounded-sm origin-center", isOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0")} />
        <span className={cn("absolute left-0 w-full h-[2px] bg-current transition-all duration-300 rounded-sm top-1/2 -translate-y-1/2", isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100")} />
        <span className={cn("absolute left-0 w-full h-[2px] bg-current transition-all duration-300 rounded-sm origin-center", isOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0")} />
      </div>
    </button>
  );
}
