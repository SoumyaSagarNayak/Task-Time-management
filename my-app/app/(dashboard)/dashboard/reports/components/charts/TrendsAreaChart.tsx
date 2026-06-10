import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Brush
} from 'recharts';
import { useReports } from '../../context/ReportsContext';

const CHART_COLORS = {
    billable: '#10B981', // emerald
    billableFill: '#86efac',
    nonBillable: '#F59E0B', // amber
    nonBillableFill: '#fde047',
};

export default function TrendsAreaChart() {
    const { billableVsNonBillable, isLoading } = useReports();
    const [stackOffset, setStackOffset] = useState<'none' | 'expand'>('none');

    if (!billableVsNonBillable || billableVsNonBillable.length === 0) {
        if (isLoading) return <div className="w-full h-full flex items-center justify-center">Loading...</div>;
        return <div className="w-full h-full flex items-center justify-center text-gray-500">No data available</div>;
    }

    // Calculate totals to not break expand if total is 0
    const data = billableVsNonBillable.map(item => ({
        ...item,
        total: item.billable + item.nonBillable
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
                    <div className="space-y-1">
                        <p className="text-sm font-medium" style={{ color: CHART_COLORS.billable }}>
                            Billable: {data.billable.toFixed(1)}h
                            {stackOffset === 'expand' && ` (${((data.billable / data.total) * 100).toFixed(1)}%)`}
                        </p>
                        <p className="text-sm font-medium" style={{ color: CHART_COLORS.nonBillable }}>
                            Non-Billable: {data.nonBillable.toFixed(1)}h
                            {stackOffset === 'expand' && ` (${((data.nonBillable / data.total) * 100).toFixed(1)}%)`}
                        </p>
                        {stackOffset === 'none' && (
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 pt-1 border-t border-gray-100 dark:border-gray-700">
                                Total: {data.total.toFixed(1)}h
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const toPercent = (decimal: number, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`;

    return (
        <div className="w-full h-full flex flex-col pt-4 transition-opacity duration-500 ease-in-out">
            <div className="flex justify-end mb-4 pr-6">
                <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                    <button
                        onClick={() => setStackOffset('none')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${stackOffset === 'none'
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Stacked Hours
                    </button>
                    <button
                        onClick={() => setStackOffset('expand')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${stackOffset === 'expand'
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Normalize (100%)
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        stackOffset={stackOffset}
                        margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                    >
                        <defs>
                            <linearGradient id="colorBillable" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS.billable} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={CHART_COLORS.billable} stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorNonBillable" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS.nonBillable} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={CHART_COLORS.nonBillable} stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                        <XAxis
                            dataKey="period"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={stackOffset === 'expand' ? toPercent : (val) => `${val}h`}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                            itemStyle={{ color: '#111827' }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
                        <Area
                            type="monotone"
                            dataKey="billable"
                            name="Billable"
                            stackId="1"
                            stroke={CHART_COLORS.billable}
                            fill="url(#colorBillable)"
                            animationDuration={1500}
                        />
                        <Area
                            type="monotone"
                            dataKey="nonBillable"
                            name="Non-Billable"
                            stackId="1"
                            stroke={CHART_COLORS.nonBillable}
                            fill="url(#colorNonBillable)"
                            animationDuration={1500}
                        />

                        {/* Provide brush control if there is a lot of data, makes scrolling easier */}
                        {data.length > 15 && (
                            <Brush
                                dataKey="period"
                                height={30}
                                stroke="#6366F1"
                                fill="#f8fafc"
                                className="dark:fill-gray-900"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
