'use client';

import { UserButton } from '@clerk/nextjs';
import { User } from 'lucide-react';
import { GlobalTimerIndicator } from '@/components/global-timer-indicator';
import Link from 'next/link';
import { HamburgerButton } from '@/components/layout/mobile-menu';
import dynamic from 'next/dynamic';
import { DarkModeToggle } from '../DarkModeToggle';

const NotificationBell = dynamic(() => import('@/components/notifications/notification-bell').then(mod => mod.NotificationBell), { ssr: false });

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <HamburgerButton />
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-gray-900">Welcome back!</h2>
          <p className="text-sm text-gray-500">Track your time and manage tasks</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <GlobalTimerIndicator />
        <NotificationBell />
        <Link
          href="/dashboard/profile"
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors duration-200 hover:border-sky-300 hover:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500"
        >
          <User className="h-4 w-4" />
          Profile
        </Link>
        <UserButton />
        <DarkModeToggle />
      </div>
    </header>
  );
}
