// src/components/drag/DraggableTaskList.tsx

import React, { useCallback, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableItem } from '@/utils/dragDrop/dragTypes';
import { useTaskDrag } from './useTaskDrag';
import { DragOverlayItem } from './DragOverlayItem';

interface DraggableTaskListProps<T> {
    tasks: T[];
    onReorder: (newTasks: T[]) => void;
    children: React.ReactNode;
    renderOverlayItem?: (task: T) => React.ReactNode;
    strategy?: 'vertical' | 'grid';
}

/**
 * Main wrapper for a list of draggable items.
 * Sets up the required DndKit providers and sensors.
 *
 * @param tasks - Array of task objects (must have an `id` property)
 * @param onReorder - Callback fired when a valid reorder occurs, receiving the updated array
 * @param children - The list elements (wrapped in SortableTaskItem)
 * @param renderOverlayItem - Optional function to render the dragging ghost element UI
 * @param strategy - "grid" or "vertical" optimization path
 */
export function DraggableTaskList<T extends DraggableItem>({
    tasks,
    onReorder,
    children,
    renderOverlayItem,
    strategy = 'grid',
}: DraggableTaskListProps<T>) {
    // 1. Accessibility & Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires minimum distance before dragging starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 2. Drag Logic Hook
    const {
        activeId,
        handleDragStart,
        handleDragOver,
        handleDragEnd: hookHandleDragEnd,
        handleDragCancel,
    } = useTaskDrag<T>({
        tasks,
        onReorder: (newTasks) => {
             // Pass back the new array to the parent to sync state
             onReorder(newTasks);
        },
        onError: (err) => {
             console.error('Drag error isolated internally:', err);
        }
    });

    // Extract exactly the item ID arrays for SortableContext
    const itemsIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
    
    // Determine sorting strategy
    const sortingStrategy = strategy === 'vertical' ? verticalListSortingStrategy : rectSortingStrategy;

    // Get the active task for overlay rendering
    const activeTask = useMemo(() => {
        return activeId ? tasks.find(t => t.id === activeId) : null;
    }, [activeId, tasks]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={hookHandleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext items={itemsIds} strategy={sortingStrategy}>
                {children}
            </SortableContext>

            {/* Render the ghost component during drag */}
            <DragOverlayItem activeId={activeId}>
                {activeTask && renderOverlayItem ? renderOverlayItem(activeTask) : null}
            </DragOverlayItem>
        </DndContext>
    );
}
