import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList,
    Cell,
} from 'recharts';
import { useReports } from '../../context/ReportsContext';

const CHART_COLORS = {
    success: '#10B981', // emerald for billable
    muted: '#94A3B8', // slate for non-billable
};

export default function TimeByTaskChart() {
    const { timeByTask, isLoading } = useReports();
    const [showAll, setShowAll] = useState(false);

    if (!timeByTask || timeByTask.length === 0) {
        if (isLoading) return <div className="w-full h-full flex items-center justify-center">Loading...</div>;
        return <div className="w-full h-full flex items-center justify-center text-gray-500">No data available</div>;
    }

    const displayData = showAll ? timeByTask : timeByTask.slice(0, 10);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
                    <p className="text-sm" style={{ color: payload[0].fill }}>
                        {payload[0].value.toFixed(1)} hrs
                        <span className="text-gray-500 dark:text-gray-400 ml-1">({payload[0].payload.billable ? 'Billable' : 'Non-billable'})</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full flex flex-col pt-2 transition-opacity duration-500 ease-in-out">
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={displayData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="taskName"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            width={150}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                            itemStyle={{ color: '#111827' }}
                        />
                        <Bar
                            dataKey="totalHours"
                            radius={[0, 4, 4, 0]}
                            animationDuration={1500}
                        >
                            {displayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.billable ? CHART_COLORS.success : CHART_COLORS.muted} />
                            ))}
                            <LabelList dataKey="totalHours" position="right" formatter={(val: any) => Number(val).toFixed(1)} fill="#6b7280" fontSize={12} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {timeByTask.length > 10 && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        {showAll ? 'Show Top 10' : `Show All (${timeByTask.length})`}
                    </button>
                </div>
            )}
        </div>
    );
}
