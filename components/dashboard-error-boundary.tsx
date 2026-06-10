'use client';

import { ErrorBoundary } from '@/components/error-boundary';

export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
