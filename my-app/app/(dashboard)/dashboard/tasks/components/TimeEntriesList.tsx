'use client';

import { useEffect, useState } from 'react';
import { useTimerStore } from '@/store/timerStore';
import { formatDateTime } from '@/lib/utils';
import { Clock, Play } from 'lucide-react';

interface TimeEntry {
    id: string;
    startTime: string;
    endTime: string;
    hours: number;
}

interface TimeEntriesListProps {
    taskId: string;
    initialEntries?: TimeEntry[];
}

function formatDurationSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export function TimeEntriesList({ taskId, initialEntries = [] }: TimeEntriesListProps) {
    const { activeTaskId, startTimestamp } = useTimerStore();
    const [now, setNow] = useState(Date.now());

    const isActive = activeTaskId === taskId;

    // Refresh "now" every second if timer is active
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive]);

    const liveSeconds = isActive && startTimestamp ? Math.floor((now - startTimestamp) / 1000) : 0;

    const historicalSeconds = initialEntries.reduce((sum, entry) => {
        return sum + Math.round(entry.hours * 3600);
    }, 0);

    const totalSeconds = historicalSeconds + liveSeconds;

    return (
        <div className="bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Clock className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Time Tracked</h2>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Total Time</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {formatDurationSeconds(totalSeconds)}
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {isActive && startTimestamp && (
                    <div className="px-6 py-4 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-900/10">
                        <div className="flex items-center gap-3">
                            <span className="relative flex w-3 h-3">
                                <span className="absolute inline-flex w-full h-full bg-indigo-400 rounded-full opacity-75 animate-ping"></span>
                                <span className="relative inline-flex w-3 h-3 bg-indigo-500 rounded-full"></span>
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">In Progress</span>
                                <span className="text-xs text-indigo-700/70 dark:text-indigo-400/70 mt-0.5">
                                    Started: {formatDateTime(new Date(startTimestamp))}
                                </span>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {formatDurationSeconds(liveSeconds)}
                        </div>
                    </div>
                )}

                {initialEntries.length === 0 && !isActive ? (
                    <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                        No time recorded for this task yet.
                    </div>
                ) : (
                    initialEntries.map((entry) => (
                        <div key={entry.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-200 font-medium">
                                    <span>{formatDateTime(entry.startTime)}</span>
                                    <span className="text-gray-300 dark:text-gray-600">→</span>
                                    <span>{formatDateTime(entry.endTime)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {formatDurationSeconds(Math.round(entry.hours * 3600))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
