'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@clerk/nextjs';

type GroupBy = 'day' | 'week' | 'month';

interface DateRange {
    from: Date;
    to: Date;
}

interface ReportsContextType {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    groupBy: GroupBy;
    setGroupBy: (groupBy: GroupBy) => void;
    selectedUserId: string | null;
    setSelectedUserId: (userId: string | null) => void;
    users: any[];
    summary: any;
    timeByTask: any[];
    userProductivity: any[];
    billableVsNonBillable: any[];
    isLoading: boolean;
    isError: boolean;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useAuth();
    const authReady = isLoaded && isSignedIn;

    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(startOfDay(new Date()), 30),
        to: endOfDay(new Date()),
    });
    const [groupBy, setGroupBy] = useState<GroupBy>('day');

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const { data: users = [] } = useQuery({
        queryKey: ['reports', 'users'],
        queryFn: async () => {
            const res = await api.get('/users');
            return res.data;
        },
        enabled: authReady,
    });

    const { data: summary, isLoading: isLoadingSummary } = useQuery({
        queryKey: ['reports', 'summary', dateRange],
        queryFn: async () => {
            const res = await api.get('/reports/summary', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                },
            });
            return res.data;
        },
        enabled: authReady,
    });

    const { data: timeByTask, isLoading: isLoadingTime } = useQuery({
        queryKey: ['reports', 'time-by-task', dateRange],
        queryFn: async () => {
            const res = await api.get('/reports/time-by-task', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                },
            });
            return res.data;
        },
        enabled: authReady,
    });

    const { data: userProductivity, isLoading: isLoadingUser } = useQuery({
        queryKey: ['reports', 'user-productivity', dateRange, groupBy],
        queryFn: async () => {
            const res = await api.get('/reports/user-productivity', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                    groupBy,
                },
            });
            return res.data;
        },
        enabled: authReady,
    });

    const { data: billableVsNonBillable, isLoading: isLoadingBillable, isError } = useQuery({
        queryKey: ['reports', 'billable', dateRange, groupBy],
        queryFn: async () => {
            const res = await api.get('/reports/billable-vs-nonbillable', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                    groupBy,
                },
            });
            return res.data;
        },
        enabled: authReady,
    });

    const value = useMemo(
        () => ({
            dateRange,
            setDateRange,
            groupBy,
            setGroupBy,
            selectedUserId,
            setSelectedUserId,
            users,
            summary: summary || null,
            timeByTask: timeByTask || [],
            userProductivity: userProductivity || [],
            billableVsNonBillable: billableVsNonBillable || [],
            isLoading: isLoadingSummary || isLoadingTime || isLoadingUser || isLoadingBillable,
            isError,
        }),
        [
            dateRange,
            groupBy,
            selectedUserId,
            users,
            summary,
            timeByTask,
            userProductivity,
            billableVsNonBillable,
            isLoadingSummary,
            isLoadingTime,
            isLoadingUser,
            isLoadingBillable,
            isError,
        ]
    );

    return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
    const context = useContext(ReportsContext);
    if (context === undefined) {
        throw new Error('useReports must be used within a ReportsProvider');
    }
    return context;
}
