// ------------------------------------------------------------------
// src/utils/dragDrop/reorderTasks.ts
// ------------------------------------------------------------------

import { getTaskIndex, moveTask } from './dragHelpers';
import { validateDragIds, validateTaskList } from './dragValidation';
import { DraggableItem } from './dragTypes';

/**
 * Safely reorders an array of items (like tasks) based on dragging IDs.
 * Used to immediately update UI state on drag completion.
 *
 * @param tasks - The current task array before reorder
 * @param activeId - The ID of the task that was picked up
 * @param overId - The ID of the task it was dropped onto
 * @returns A structurally new array with tasks reordered, or the original if invalid
 */
export function reorderTasks<T extends DraggableItem>(
    tasks: T[],
    activeId: string | number | undefined,
    overId: string | number | undefined | null
): T[] {
    // 1. Initial Validation
    if (!validateTaskList(tasks)) return tasks;
    if (!validateDragIds(activeId, overId)) return tasks;

    // 2. Find internal indices safely
    const oldIndex = getTaskIndex(tasks, activeId!);
    const newIndex = getTaskIndex(tasks, overId!);

    if (oldIndex === -1 || newIndex === -1) {
        return tasks; // Items not found, abort reorder safely
    }

    // 3. Perform immutable reorder
    return moveTask(tasks, oldIndex, newIndex);
}
