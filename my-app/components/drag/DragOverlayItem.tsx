// src/components/drag/DragOverlayItem.tsx

import React from 'react';
import { DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';

interface DragOverlayItemProps {
    activeId: string | number | null;
    children?: React.ReactNode;
}

const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

/**
 * Renders a "ghost" element of the task being dragged.
 * It follows the cursor smoothly outside normal document flow.
 */
export function DragOverlayItem({ activeId, children }: DragOverlayItemProps) {
    if (!activeId) return null;

    return (
        <DragOverlay dropAnimation={dropAnimation}>
            {/* The child component rendered here should ideally look exactly like the original item */}
            <div style={{ cursor: 'grabbing', opacity: 0.9, transform: 'scale(1.02)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', borderRadius: '0.5rem' }}>
               {children}
            </div>
        </DragOverlay>
    );
}
