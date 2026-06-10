import { useState, useEffect } from 'react';
import { useTimerStore } from '@/store/timerStore';

export function useTimer(taskId?: string) {
    const { activeTaskId, getElapsed } = useTimerStore();
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const isActive = taskId ? activeTaskId === taskId : !!activeTaskId;

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            // Initialize immediately
            setElapsedSeconds(getElapsed());

            interval = setInterval(() => {
                setElapsedSeconds(getElapsed());
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isActive, getElapsed]);

    const formatElapsed = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const pad = (num: number) => num.toString().padStart(2, '0');

        if (h > 0) {
            return `${pad(h)}:${pad(m)}:${pad(s)}`;
        }
        return `${pad(m)}:${pad(s)}`;
    };

    return {
        elapsedSeconds,
        formattedTime: formatElapsed(elapsedSeconds),
        isActive,
    };
}
