// ------------------------------------------------------------------
// src/utils/dragDrop/dragHelpers.ts
// ------------------------------------------------------------------

import { arrayMove } from '@dnd-kit/sortable';
import { dragLogger } from '../logger/dragLogger';
import { DraggableItem, ReorderPayload } from './dragTypes';

/**
 * Gets the index of an item within a list by its ID.
 * Returns -1 if not found.
 * 
 * @param items - The array of items
 * @param id - The target ID to find
 * @returns number (index)
 */
export function getTaskIndex<T extends DraggableItem>(items: T[], id: string | number): number {
    return items.findIndex((item) => item.id === id);
}

/**
 * Moves an item from one index to another immutably.
 * Wraps @dnd-kit/sortable arrayMove for consistency and safety.
 * 
 * @param items - The list of items
 * @param oldIndex - Current index of the item
 * @param newIndex - New index to place the item
 * @returns A new array with the item moved
 */
export function moveTask<T extends DraggableItem>(items: T[], oldIndex: number, newIndex: number): T[] {
    try {
        if (oldIndex < 0 || newIndex < 0 || oldIndex >= items.length || newIndex >= items.length) {
            dragLogger.logDragError(`Invalid indices for moveTask: old(${oldIndex}), new(${newIndex}), length(${items.length})`);
            return items;
        }
        return arrayMove(items, oldIndex, newIndex);
    } catch (e) {
        dragLogger.logDragError('Failed to move task array.', e);
        return items;
    }
}

/**
 * Generates a payload useful for backend sync.
 * Creates an array mapping task IDs to their new absolute or relative order index.
 * 
 * @param items - The reordered list of tasks
 * @returns Array of ReorderPayload objects
 */
export function createReorderedPayload<T extends DraggableItem>(items: T[]): ReorderPayload[] {
    return items.map((item, index) => ({
        id: item.id,
        order: index + 1 // 1-based ordering or whatever specific semantic is needed
    }));
}
