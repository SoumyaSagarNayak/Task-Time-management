// ------------------------------------------------------------------
// src/utils/logger/dragLogger.ts
// ------------------------------------------------------------------

/**
 * Simple logger for drag and drop operations.
 * Helps with debugging and monitoring in development or monitoring systems.
 */

export const dragLogger = {
    /**
     * Logs the start of a drag operation.
     * @param activeId - Internal ID of the dragged item
     */
    logDragStart: (activeId: string | number) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DragDrop] Started dragging item: ${activeId}`);
        }
    },

    /**
     * Logs the end of a drag operation.
     * @param activeId - Internal ID of the dragged item
     * @param overId - Internal ID of the drop target item (if any)
     */
    logDragEnd: (activeId: string | number, overId: string | number | null) => {
        if (process.env.NODE_ENV !== 'production') {
            if (overId) {
                console.log(`[DragDrop] Dropped item: ${activeId} over item: ${overId}`);
            } else {
                console.log(`[DragDrop] Dropped item: ${activeId} outside a valid drop target.`);
            }
        }
    },

    /**
     * Logs successful reorder operations locally.
     * @param activeId - Dragged item ID
     * @param newIndex - New index in the list
     */
    logReorder: (activeId: string | number, newIndex: number) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DragDrop] Reordered item ${activeId} to index: ${newIndex}`);
        }
    },

    /**
     * Logs errors encountered during drag or reorder operations.
     * @param message - High-level error description
     * @param error - The actual Error object or error context
     */
    logDragError: (message: string, error?: unknown) => {
        console.error(`[DragDrop Error] ${message}`, error || '');
    }
};
