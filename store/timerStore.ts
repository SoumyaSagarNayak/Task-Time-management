import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTimeEntry } from '@/lib/api';
import { TimeEntry } from '@/types/timer';

interface TimerStore {
    activeTaskId: string | null;
    activeTaskTitle: string | null;
    startTimestamp: number | null;
    isSaving: boolean;

    startTimer: (taskId: string, taskTitle: string) => Promise<void>;
    stopTimer: () => Promise<TimeEntry | null>;
    getElapsed: () => number;
}

export const useTimerStore = create<TimerStore>()(
    persist(
        (set, get) => ({
            activeTaskId: null,
            activeTaskTitle: null,
            startTimestamp: null,
            isSaving: false,

            startTimer: async (taskId: string, taskTitle: string) => {
                const state = get();
                if (state.activeTaskId === taskId) return;

                // Stop current timer if exists
                if (state.activeTaskId) {
                    await state.stopTimer();
                }

                set({
                    activeTaskId: taskId,
                    activeTaskTitle: taskTitle,
                    startTimestamp: Date.now(),
                });
            },

            stopTimer: async () => {
                const { activeTaskId, startTimestamp } = get();
                if (!activeTaskId || !startTimestamp) return null;

                set({ isSaving: true });

                const stoppedAt = Date.now();
                const durationSeconds = Math.floor((stoppedAt - startTimestamp) / 1000);

                try {
                    // Keep state until API succeeds.
                    const entry = await createTimeEntry({
                        taskId: activeTaskId,
                        startedAt: new Date(startTimestamp).toISOString(),
                        stoppedAt: new Date(stoppedAt).toISOString(),
                        durationSeconds,
                        source: 'timer',
                    });

                    set({
                        activeTaskId: null,
                        startTimestamp: null,
                        isSaving: false,
                    });

                    return entry;
                } catch (error) {
                    console.error('Failed to save time entry:', error);
                    set({ isSaving: false });
                    throw error;
                }
            },

            getElapsed: () => {
                const { startTimestamp } = get();
                if (!startTimestamp) return 0;
                return Math.floor((Date.now() - startTimestamp) / 1000);
            },
        }),
        {
            name: 'flow-pilot-timer-storage',
        }
    )
);
