// src/components/drag/SortableTaskItem.tsx

import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './dragStyles.module.css';

interface SortableTaskItemProps {
    id: string | number;
    children: React.ReactNode;
    disabled?: boolean;
}

/**
 * Wraps any component (e.g. TaskCard) to make it sortable/draggable.
 * It applies the necessary DndKit hooks and styles without mutating the child logic.
 *
 * @param id - The unique identifier matching the item ID
 * @param children - The component to make draggable
 * @param disabled - Option to disable drag on specific items
 */
export const SortableTaskItem = memo(function SortableTaskItem({ id, children, disabled = false }: SortableTaskItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isDragging ? { zIndex: 9999 } : {}),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles.sortableItem} ${isDragging ? styles.dragging : ''}`}
            {...attributes}
            {...listeners}
            role="listitem"
            aria-roledescription="sortable item"
        >
            {/* 
              Render the underlying Card directly.
              By applying listeners to the wrapper, the whole card is draggable.
              If we wanted only a drag handle, we'd pass listeners down.
            */}
            <div style={{ opacity: isDragging ? 0 : 1 }}>
                 {children}
            </div>
        </div>
    );
});
