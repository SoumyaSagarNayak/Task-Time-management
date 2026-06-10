'use client';

import React, { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfDay, endOfDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DateRange {
    from: Date;
    to: Date;
}

interface DateRangePickerProps {
    dateRange: DateRange;
    onChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onChange }: DateRangePickerProps) {
    const [open, setOpen] = useState(false);
    const [localRange, setLocalRange] = useState<{ from?: Date; to?: Date }>({
        from: dateRange.from,
        to: dateRange.to
    });

    const setPreset = (days: number, type: 'days' | 'month' | 'quarter' | 'today') => {
        const today = new Date();
        let from = new Date();
        let to = endOfDay(today);

        if (type === 'today') {
            from = startOfDay(today);
        } else if (type === 'days') {
            from = startOfDay(subDays(today, days - 1));
        } else if (type === 'month') {
            from = startOfMonth(today);
            if (days > 0) { // e.g. last month
                from = startOfMonth(subDays(from, 1));
                to = endOfMonth(from);
            } else {
                to = endOfMonth(today);
            }
        } else if (type === 'quarter') {
            from = startOfQuarter(today);
            to = endOfQuarter(today);
        }

        const newRange = { from, to };
        setLocalRange(newRange);
        onChange(newRange);
        setOpen(false);
    };

    const handleApply = () => {
        if (localRange.from && localRange.to) {
            onChange({ from: localRange.from, to: localRange.to });
        } else if (localRange.from) {
            onChange({ from: localRange.from, to: endOfDay(localRange.from) });
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                        'w-[300px] justify-start text-left font-normal',
                        !dateRange && 'text-muted-foreground'
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                                {format(dateRange.from, 'LLL dd, y')} -{' '}
                                {format(dateRange.to, 'LLL dd, y')}
                            </>
                        ) : (
                            format(dateRange.from, 'LLL dd, y')
                        )
                    ) : (
                        <span>Pick a date range</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex" align="start">
                <div className="flex flex-col gap-1 border-r border-gray-200 dark:border-gray-800 p-2 min-w-[150px]">
                    <Button variant="ghost" className="justify-start text-sm" onClick={() => setPreset(0, 'today')}>Today</Button>
                    <Button variant="ghost" className="justify-start text-sm" onClick={() => setPreset(7, 'days')}>Last 7 Days</Button>
                    <Button variant="ghost" className="justify-start text-sm" onClick={() => setPreset(0, 'month')}>This Month</Button>
                    <Button variant="ghost" className="justify-start text-sm" onClick={() => setPreset(30, 'days')}>Last 30 Days</Button>
                    <Button variant="ghost" className="justify-start text-sm" onClick={() => setPreset(0, 'quarter')}>This Quarter</Button>
                </div>
                <div className="p-3">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={localRange?.from}
                        selected={localRange.from ? ({ from: localRange.from, to: localRange.to } as { from: Date; to?: Date }) : undefined}
                        onSelect={(range) => setLocalRange(range as { from?: Date; to?: Date })}
                        numberOfMonths={2}
                    />
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleApply}>Apply</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
