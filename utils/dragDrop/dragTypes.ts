// ------------------------------------------------------------------
// src/utils/dragDrop/dragTypes.ts
// ------------------------------------------------------------------

/**
 * Common interfaces for Drag and Drop logic.
 * Enforces strict typing for items being dragged.
 */

export interface DraggableItem {
    id: string;
    [key: string]: any; // Allow the item to hold any additional properties (like actual Task data)
}

/**
 * Represents the structured payload that could be sent to a backend
 * after a successful reorder operation.
 */
export interface ReorderPayload {
    id: string;
    order: number;
}
