'use client';

import { useEffect, useState } from 'react';
import { useTimerStore } from '@/store/timerStore';
import { useTimer } from '@/hooks/useTimer';
import { Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function GlobalTimerIndicator() {
    const { activeTaskId, activeTaskTitle, stopTimer, isSaving } = useTimerStore();
    const { formattedTime } = useTimer(activeTaskId || undefined);

    // Prevent hydration mismatch by only rendering after mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !activeTaskId) return null;

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-full shadow-sm mr-2 transition-all">
            <Link href={`/dashboard/tasks/${activeTaskId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
                    <span className="relative inline-flex w-2 h-2 bg-red-500 rounded-full"></span>
                </span>
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 max-w-[120px] truncate">
                    {activeTaskTitle || 'Timing...'}
                </span>
                <span className="tabular-nums text-xs font-bold text-red-600 dark:text-red-300">
                    {formattedTime}
                </span>
            </Link>

            <div className="w-px h-4 bg-red-200 dark:bg-red-500/20" />

            <button
                onClick={() => stopTimer()}
                disabled={isSaving}
                className={cn(
                    "p-1 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors",
                    isSaving && "opacity-50 cursor-not-allowed"
                )}
                title="Stop timer"
            >
                {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Square className="w-3.5 h-3.5 fill-current" />
                )}
            </button>
        </div>
    );
}
