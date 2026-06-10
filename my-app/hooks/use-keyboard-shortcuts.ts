'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
    const router = useRouter();
    const lastKeyRef = useRef<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const key = event.key.toLowerCase();

            // "g" sequence (go-to)
            if (lastKeyRef.current === 'g') {
                const routes: Record<string, string> = {
                    d: '/dashboard',
                    t: '/dashboard/tasks',
                    e: '/dashboard/time-entries',
                    p: '/dashboard/profile',
                };

                if (routes[key]) {
                    event.preventDefault();
                    router.push(routes[key]);
                }

                // Clear the sequence
                lastKeyRef.current = null;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                return;
            }

            // Start sequence
            if (key === 'g') {
                lastKeyRef.current = 'g';

                // Clear if second key isn't pressed within 1 second
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    lastKeyRef.current = null;
                }, 1000);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [router]);
}
