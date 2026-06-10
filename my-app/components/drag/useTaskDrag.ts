// src/components/drag/useTaskDrag.ts

import { useState, useCallback } from 'react';
import { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { DraggableItem } from '@/utils/dragDrop/dragTypes';
import { reorderTasks } from '@/utils/dragDrop/reorderTasks';
import { dragLogger } from '@/utils/logger/dragLogger';
import { getTaskIndex } from '@/utils/dragDrop/dragHelpers';

interface UseTaskDragProps<T> {
    tasks: T[];
    onReorder: (newTasks: T[], reorderedTask: T, newIndex: number) => void;
    onError?: (error: Error) => void;
}

/**
 * Custom hook to abstract DND Kit event handling and state logic.
 * Handles validation, local state for active drags, and triggers reorder callbacks.
 */
export function useTaskDrag<T extends DraggableItem>({ tasks, onReorder, onError }: UseTaskDragProps<T>) {
    const [activeId, setActiveId] = useState<string | number | null>(null);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        if (!active || !active.id) return;
        
        setActiveId(active.id);
        dragLogger.logDragStart(active.id);
    }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
         // Placeholder for more complex behavior like moving lists
         // Currently isolated to single-list sorting
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        
        dragLogger.logDragEnd(active.id, over?.id ?? null);

        if (!over || active.id === over.id) {
            return; // Dropped outside or in same spot
        }

        try {
            const reorderedTasks = reorderTasks(tasks, active.id, over.id);
            const newIndex = getTaskIndex(reorderedTasks, active.id);
            const activeTask = tasks.find(t => t.id === active.id);
            
            if (activeTask && newIndex !== -1) {
                dragLogger.logReorder(active.id, newIndex);
                onReorder(reorderedTasks, activeTask, newIndex);
            }
        } catch (error) {
           dragLogger.logDragError('Failed to process drop event', error);
           if (onError && error instanceof Error) {
               onError(error);
           }
        }
    }, [tasks, onReorder, onError]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);

    return {
        activeId,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragCancel
    };
}
