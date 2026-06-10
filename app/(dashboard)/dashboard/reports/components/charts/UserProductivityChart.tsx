import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { useReports } from '../../context/ReportsContext';

export default function UserProductivityChart() {
    const { userProductivity, isLoading } = useReports();
    const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());

    // Palette generator based on index
    const getColor = (index: number) => {
        const palette = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#0EA5E9', '#14B8A6'];
        return palette[index % palette.length];
    };

    const { transformedData, keys, userMap } = useMemo(() => {
        if (!userProductivity || userProductivity.length === 0) return { transformedData: [], keys: [], userMap: {} };

        const bucketMap = new Map<string, any>();
        const userNames: Record<string, string> = {};
        const uKeys: string[] = [];

        userProductivity.forEach((u) => {
            userNames[u.userId] = u.userName;
            uKeys.push(u.userId);

            u.buckets.forEach((b: any) => {
                if (!bucketMap.has(b.period)) {
                    bucketMap.set(b.period, { period: b.period });
                }
                const bucketData = bucketMap.get(b.period)!;
                bucketData[u.userId] = b.hours;
            });
        });

        const arr = Array.from(bucketMap.values()).sort((a, b) => a.period.localeCompare(b.period));
        // Fill gaps with 0
        arr.forEach(item => {
            uKeys.forEach(k => {
                if (item[k] === undefined) item[k] = 0;
            });
        });

        return { transformedData: arr, keys: uKeys, userMap: userNames };
    }, [userProductivity]);

    if (!transformedData || transformedData.length === 0) {
        if (isLoading) return <div className="w-full h-full flex items-center justify-center">Loading...</div>;
        return <div className="w-full h-full flex items-center justify-center text-gray-500">No data available</div>;
    }

    const handleLegendClick = (dataKey: string) => {
        const newDisabled = new Set(disabledUsers);
        if (newDisabled.has(dataKey)) {
            newDisabled.delete(dataKey);
        } else {
            newDisabled.add(dataKey);
        }
        setDisabledUsers(newDisabled);
    };

    return (
        <div className="w-full h-full flex flex-col pt-4 transition-opacity duration-500 ease-in-out">
            <div className="flex-1 w-full min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={transformedData}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                        <XAxis
                            dataKey="period"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e5e7eb' }}
                            padding={{ left: 15, right: 15 }}
                        />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${val}h`}
                        />
                        <Tooltip
                            cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '3 3' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any, name: any) => [`${Number(value).toFixed(1)} hrs`, userMap[name] || name]}
                            labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}
                        />
                        <Legend
                            onClick={(e: any) => handleLegendClick(e.dataKey)}
                            wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
                            formatter={(value, entry) => {
                                const { color } = entry;
                                return <span style={{ color, opacity: disabledUsers.has(value) ? 0.4 : 1 }}>{userMap[value]}</span>;
                            }}
                        />
                        <ReferenceLine y={8} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target (8h)', fill: '#EF4444', fontSize: 12 }} />

                        {keys.map((k, index) => (
                            <Line
                                key={k}
                                type="monotone"
                                dataKey={k}
                                name={k}
                                stroke={getColor(index)}
                                strokeWidth={3}
                                dot={{ r: 3, strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                hide={disabledUsers.has(k)}
                                animationDuration={2000}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
