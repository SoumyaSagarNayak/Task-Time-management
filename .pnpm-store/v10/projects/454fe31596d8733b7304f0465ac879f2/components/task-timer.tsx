'use client';

import { Play, Square, Loader2 } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { useTimerStore } from '@/store/timerStore';
import { cn } from '@/lib/utils';
import { useState, MouseEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface TaskTimerProps {
    taskId: string;
    taskTitle: string;
}

export function TaskTimer({ taskId, taskTitle }: TaskTimerProps) {
    const { isActive, formattedTime } = useTimer(taskId);
    const { startTimer, stopTimer, isSaving } = useTimerStore();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const isLocallySaving = isSaving && isActive;

    const handleToggle = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setError(null);

        // If another timer is active or we are idle, starting this timer will stop the other one globally.
        // If it's already active, we just stop this timer.
        try {
            if (isActive) {
                await stopTimer();
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
                    queryClient.invalidateQueries({ queryKey: ['tasks'] }),
                ]);
            } else {
                await startTimer(taskId, taskTitle);
            }
        } catch {
            setError('Failed to save');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleToggle}
                disabled={isLocallySaving}
                className={cn(
                    'flex items-center justify-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors border',
                    isActive
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20'
                        : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 dark:hover:bg-green-500/20',
                    isLocallySaving && 'opacity-70 cursor-not-allowed'
                )}
            >
                {isLocallySaving ? (
                    <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Saving...</span>
                    </>
                ) : isActive ? (
                    <>
                        <Square className="w-3 h-3 fill-current" />
                        <span className="tabular-nums min-w-[42px]">{formattedTime}</span>
                    </>
                ) : (
                    <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                    </>
                )}
            </button>
            {error && <span className="text-[10px] text-red-500">{error}</span>}
            {isActive && !isLocallySaving && (
                <span className="flex w-2 h-2">
                    <span className="absolute inline-flex w-2 h-2 bg-red-400 rounded-full opacity-75 animate-ping"></span>
                    <span className="relative inline-flex w-2 h-2 bg-red-500 rounded-full"></span>
                </span>
            )}
        </div>
    );
}
