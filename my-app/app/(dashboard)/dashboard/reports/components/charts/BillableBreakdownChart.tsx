import React, { useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Sector
} from 'recharts';
import { useReports } from '../../context/ReportsContext';

const CHART_COLORS = {
    billable: '#10B981', // emerald
    nonBillable: '#F59E0B', // amber
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
        <g>
            <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} className="text-xl font-bold">
                {payload.name}
            </text>
            <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#6b7280" className="text-sm">
                {`${(percent * 100).toFixed(1)}%`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 10}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        </g>
    );
};

export default function BillableBreakdownChart() {
    const { summary, isLoading } = useReports();
    const [activeIndex, setActiveIndex] = useState(0);

    if (!summary || summary.totalHours === 0) {
        if (isLoading) return <div className="w-full h-full flex items-center justify-center">Loading...</div>;
        return <div className="w-full h-full flex items-center justify-center text-gray-500">No data available</div>;
    }

    const data = [
        { name: 'Billable', value: summary.billableHours },
        { name: 'Non-Billable', value: summary.nonBillableHours },
    ].filter(d => d.value > 0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].name}</p>
                    <p className="text-sm" style={{ color: payload[0].fill }}>
                        {payload[0].value.toFixed(1)} hrs
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full flex flex-col transition-opacity duration-500 ease-in-out">
            <div className="flex-1 w-full min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            {...({ activeIndex: activeIndex === -1 ? undefined : activeIndex } as any)}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="80%"
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'Billable' ? CHART_COLORS.billable : CHART_COLORS.nonBillable} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={<CustomTooltip />}
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                            itemStyle={{ color: '#111827' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center fallback label if no hover */}
                {activeIndex === -1 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalHours.toFixed(1)}h</span>
                        <span className="text-sm text-gray-500">Total</span>
                    </div>
                )}
            </div>

            {/* Summary Table */}
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="flex flex-col items-center p-2 rounded bg-emerald-50 dark:bg-emerald-950/30">
                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400 mb-1">Billable</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">{summary.billableHours.toFixed(1)}h ({summary.billablePercentage}%)</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded bg-amber-50 dark:bg-amber-950/30">
                    <span className="text-xs font-medium text-amber-800 dark:text-amber-400 mb-1">Non-Billable</span>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-500">{summary.nonBillableHours.toFixed(1)}h ({(100 - summary.billablePercentage).toFixed(2)}%)</span>
                </div>
            </div>
        </div>
    );
}
