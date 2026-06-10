import type { TimeEntry, TimeSummary } from '@/lib/types';

export const MOCK_TIME_SUMMARY: TimeSummary = {
  summary: {
    totalHours: 4,
    entriesCount: 1,
  },
  byUser: [],
  byTask: [],
};

export const MOCK_TIME_ENTRIES: TimeEntry[] = [
  {
    id: '1',
    userId: 'default-user',
    description: '',
    startTime: '2026-04-16T09:00:00+05:30',
    endTime: '2026-04-16T13:00:00+05:30',
    hours: 4,
    createdAt: '2026-04-16T09:00:00+05:30',
    updatedAt: '2026-04-16T09:00:00+05:30',
    tasks: [],
  },
];

