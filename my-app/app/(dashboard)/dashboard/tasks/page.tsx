import { Suspense } from 'react';
import { TasksClient } from './TasksClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasks | Flow Pilot',
  description: 'Manage and filter your project tasks effectively',
};

export default function TasksPage() {
  return (
    <main>
      <Suspense fallback={<div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Tasks</h1><p className="text-muted-foreground">Manage your work items</p></div></div><p>Loading tasks...</p></div>}>
        <TasksClient />
      </Suspense>
    </main>
  );
}
