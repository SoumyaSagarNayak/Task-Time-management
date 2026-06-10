export interface TimeEntry {
    id: string;
    taskId: string | null;
    durationSeconds: number;
    formattedDuration: string;
    createdAt: string;
}

export interface TimerState {
    activeTaskId: string | null;
    startTimestamp: number | null;
}
