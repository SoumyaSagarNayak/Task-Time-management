'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Employee } from '@/lib/types';
import { Check, ChevronsUpDown, Search, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface AssigneeDropdownProps {
    value?: string;
    onChange: (value?: string) => void;
}

const AVATAR_COLORS = [
    'bg-indigo-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-amber-500',
];

// Helper to get consistent color based on string
const getColorIndex = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % AVATAR_COLORS.length;
};

export function AssigneeDropdown({ value, onChange }: AssigneeDropdownProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const { getToken, isLoaded, userId } = useAuth();

    const { data: employees, isLoading, isError, refetch } = useQuery<Employee[]>({
        queryKey: ['employees', userId],
        queryFn: async () => {
            const token = await getToken();
            const response = await api.get('/employees', {
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                },
            });
            return response.data;
        },
        enabled: isLoaded && !!userId,
    });

    const filteredEmployees = React.useMemo(() => {
        if (!employees) return [];
        if (!search) return employees;
        const lowerSearch = search.toLowerCase();
        return employees.filter(
            (emp) =>
                emp.fullName.toLowerCase().includes(lowerSearch) ||
                (emp.department && emp.department.toLowerCase().includes(lowerSearch))
        );
    }, [employees, search]);

    const selectedEmployee = React.useMemo(
        () => employees?.find((emp) => emp.id === value),
        [employees, value]
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-750 hover:text-white"
                >
                    {selectedEmployee ? (
                        <div className="flex items-center gap-2 truncate">
                            {selectedEmployee.avatarUrl ? (
                                <img
                                    src={selectedEmployee.avatarUrl}
                                    alt={selectedEmployee.fullName}
                                    className="w-5 h-5 rounded-full"
                                />
                            ) : (
                                <div
                                    className={cn(
                                        'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white',
                                        AVATAR_COLORS[getColorIndex(selectedEmployee.id)]
                                    )}
                                >
                                    {selectedEmployee.initials}
                                </div>
                            )}
                            <span className="font-medium">{selectedEmployee.fullName}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400">Select assignee...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-[#1f2937] border-gray-700 z-[100] shadow-xl origin-top-right" align="start">
                <div className="flex items-center border-b border-gray-700 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />
                    <Input
                        placeholder="Search name or department..."
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 text-gray-100"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                    {isLoading && (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 w-full animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-gray-700" />
                                    <div className="space-y-1 flex-1">
                                        <div className="h-3 w-24 bg-gray-700 rounded" />
                                        <div className="h-2 w-16 bg-gray-700 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isError && !isLoading && (
                        <div className="p-4 text-center text-sm text-red-400 space-y-2">
                            <p>Could not load employees</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
                                Retry
                            </Button>
                        </div>
                    )}

                    {!isLoading && !isError && (
                        <>
                            {/* No Assignee Option */}
                            <div
                                className={cn(
                                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-gray-800 text-gray-300',
                                    !value && 'bg-indigo-600/20 border-l-2 border-indigo-500 text-white'
                                )}
                                onClick={() => {
                                    onChange(undefined);
                                    setOpen(false);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 border-dashed flex items-center justify-center">
                                        <UserX className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <span className="font-medium">Unassigned</span>
                                </div>
                                {!value && <Check className="ml-auto h-4 w-4 text-indigo-500" />}
                            </div>

                            {filteredEmployees.length === 0 ? (
                                <div className="py-6 text-center text-sm text-gray-500">
                                    No employees found.
                                </div>
                            ) : (
                                filteredEmployees.map((emp) => {
                                    const isSelected = value === emp.id;
                                    return (
                                        <div
                                            key={emp.id}
                                            className={cn(
                                                'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-gray-800 text-gray-200',
                                                isSelected && 'bg-indigo-600/20 border-l-2 border-indigo-500 text-white'
                                            )}
                                            onClick={() => {
                                                onChange(emp.id);
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                {emp.avatarUrl ? (
                                                    <img
                                                        src={emp.avatarUrl}
                                                        alt={emp.fullName}
                                                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-700"
                                                    />
                                                ) : (
                                                    <div
                                                        className={cn(
                                                            'w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white border border-gray-700',
                                                            AVATAR_COLORS[getColorIndex(emp.id)]
                                                        )}
                                                    >
                                                        {emp.initials}
                                                    </div>
                                                )}
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="font-semibold truncate pr-2">{emp.fullName}</span>
                                                        <span className="text-[10px] text-gray-500 shrink-0">{emp.email}</span>
                                                    </div>
                                                    {emp.department && (
                                                        <span className="text-[11px] text-gray-400 truncate mt-0.5">
                                                            {emp.department}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && <Check className="ml-2 h-4 w-4 text-indigo-500 shrink-0" />}
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
