'use client';

import React, { Suspense } from 'react';
import { ReportsProvider } from './context/ReportsContext';

// Lazy loaded dashboard
const ReportsDashboard = React.lazy(() => import('./components/ReportsDashboard'));

function ReportsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
      <div className="flex gap-4 mb-6">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6"></div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6"></div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ReportsProvider>
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsDashboard />
      </Suspense>
    </ReportsProvider>
  );
}
