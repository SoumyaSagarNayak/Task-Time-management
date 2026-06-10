"use client";

import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ErrorBoundary } from "@/components/error-boundary";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { MobileMenuProvider } from "@/hooks/useMobileMenu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Sync logged in user profile with the local mock database
  useEffect(() => {
    if (isLoaded && user) {
      import('@/lib/mock-db').then(({ syncClerkUser }) => {
        syncClerkUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          avatarUrl: user.imageUrl || '',
        });
      });
    }
  }, [user, isLoaded]);

  useQuery({
    queryKey: ["ensure-user"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.post(
        "/auth/ensure-user",
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        },
      );
      return response.data;
    },
    enabled: isLoaded && !!user,
    staleTime: Infinity,
  });

  return (
    <MobileMenuProvider>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden lg:flex focus-none outline-none">
          <Sidebar />
        </div>
        <MobileMenu />
        <div className="flex flex-1 flex-col overflow-hidden w-full relative">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6">
            {children}
          </main>
        </div>
      </div>
    </MobileMenuProvider>
  );
}
