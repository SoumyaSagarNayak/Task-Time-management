// ------------------------------------------------------------------
// src/utils/dragDrop/dragValidation.ts
// ------------------------------------------------------------------

import { dragLogger } from '../logger/dragLogger';

/**
 * Validates if the given activeId and overId are valid strings/numbers.
 * If activeId equals overId, the item was dropped in the same place.
 * 
 * @param activeId - Dragged item IDs
 * @param overId - Drop target ID
 * @returns boolean indicating if the drag is structurally valid and resulted in movement
 */
export function validateDragIds(activeId: string | number | undefined, overId: string | number | undefined | null): boolean {
    if (activeId === undefined || overId === undefined || overId === null) {
        dragLogger.logDragError('Invalid IDs provided to drag. activeId or overId is undefined.');
        return false;
    }

    if (activeId === overId) {
        // Not an error, just no movement needed
        return false;
    }

    return true;
}

/**
 * Validates if the list of tasks is a valid array.
 * @param tasks - The task array
 * @returns true if valid array
 */
export function validateTaskList<T>(tasks: T[] | undefined | null): boolean {
    if (!tasks || !Array.isArray(tasks)) {
        dragLogger.logDragError('Task list is invalid or undefined during drag operation.');
        return false;
    }
    return true;
}
