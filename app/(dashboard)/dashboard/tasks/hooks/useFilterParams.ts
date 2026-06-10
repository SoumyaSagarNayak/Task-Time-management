'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useFilterParams() {
    const router = useRouter();
    const params = useSearchParams();

    const getParam = (key: string, fallback = '') => params.get(key) ?? fallback;

    const setParams = useCallback(
        (updates: Record<string, string>) => {
            const next = new URLSearchParams(params.toString());
            Object.entries(updates).forEach(([k, v]) => {
                if (!v || v === 'all') next.delete(k);
                else next.set(k, v);
            });
            router.replace(`/dashboard/tasks?${next.toString()}`, { scroll: false });
        },
        [router, params]
    );

    return { getParam, setParams };
}
