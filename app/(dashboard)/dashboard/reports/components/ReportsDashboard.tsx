import React from 'react';
import { useReports } from '../context/ReportsContext';
import { DateRangePicker } from './DateRangePicker';
import { KPICard } from './KPICard';
import { ChartCard } from './ChartCard';
import { Clock, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportAllCharts, exportTimeEntries } from '../utils/export';
import { useAuth } from '@clerk/nextjs';

// Lazy load charts to reduce initial bundle size for this huge dashboard
import TimeByTaskChart from './charts/TimeByTaskChart';
import BillableBreakdownChart from './charts/BillableBreakdownChart';
import UserProductivityChart from './charts/UserProductivityChart';
import TrendsAreaChart from './charts/TrendsAreaChart';

export default function ReportsDashboard() {
    const { getToken } = useAuth();
    const {
        dateRange,
        setDateRange,
        groupBy,
        setGroupBy,
        summary,
        isLoading,
        isError,
        selectedUserId,
        setSelectedUserId,
        users,
    } = useReports();

    const handleExportAll = () => {
        exportAllCharts(
            ['time-by-task-chart', 'billable-breakdown-chart', 'user-productivity-chart', 'trends-area-chart'],
            'Reports_Dashboard'
        );
    };

    const handleExportTimeEntries = async (format: 'csv' | 'pdf') => {
        const token = await getToken();
        await exportTimeEntries(
            {
                startDate: dateRange.from.toISOString(),
                endDate: dateRange.to.toISOString(),
                userId: selectedUserId || undefined,
            },
            format,
            token,
        );
    };

    const formatHours = (val: number) => {
        return `${val.toFixed(1)}h`;
    };

    if (isError) {
        return (
            <div className="p-6 text-center text-red-600">
                <p>Failed to load report data. Please try again later.</p>
            </div>
        );
    }

    if (isLoading && !summary) {
        return <div className="p-6">Loading initial data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Reports</h1>
                    <p className="text-gray-500 text-sm mt-1">Analytics and time-tracking insights</p>
                </div>
                <Button onClick={handleExportAll} variant="secondary">
                    Export All (ZIP)
                </Button>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <DateRangePicker
                    dateRange={dateRange}
                    onChange={(newRange) => setDateRange(newRange)}
                />

                <div className="flex items-center gap-2">
                    {/* user filter */}
                    <select
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(e.target.value || null)}
                        className="px-2 py-1 border rounded bg-white dark:bg-gray-950 dark:border-gray-800"
                    >
                        <option value="">All users</option>
                        {users.map((u: any) => (
                            <option key={u.id} value={u.id}>
                                {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                            </option>
                        ))}
                    </select>

                    <Button
                        variant="outline"
                        onClick={() => handleExportTimeEntries('csv')}
                    >
                        CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleExportTimeEntries('pdf')}
                    >
                        PDF
                    </Button>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                    {(['day', 'week', 'month'] as const).map((g) => (
                        <button
                            key={g}
                            onClick={() => setGroupBy(g)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${groupBy === g
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                     : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Hours"
                    value={formatHours(summary?.totalHours || 0)}
                    subtitle="Total logged time"
                    icon={Clock}
                    colorClass="text-blue-500"
                />
                <KPICard
                    title="Billable Hours"
                    value={formatHours(summary?.billableHours || 0)}
                    subtitle={`${summary?.billablePercentage || 0}% of total`}
                    icon={DollarSign}
                    colorClass="text-emerald-500"
                />
                <KPICard
                    title="Non-Billable"
                    value={formatHours(summary?.nonBillableHours || 0)}
                    icon={Clock}
                    colorClass="text-amber-500"
                />
                <KPICard
                    title="Active Users"
                    value={summary?.activeUsers || 0}
                    subtitle={`${summary?.activeTasks || 0} active tasks`}
                    icon={Users}
                    colorClass="text-indigo-500"
                />
            </div>

            {/* Row 1 Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Time by Task" chartId="time-by-task-chart">
                    <TimeByTaskChart />
                </ChartCard>

                <ChartCard title="Billable Breakdown" chartId="billable-breakdown-chart">
                    <BillableBreakdownChart />
                </ChartCard>
            </div>

            {/* Row 2 Chart (Full Width) */}
            <ChartCard title="User Productivity" chartId="user-productivity-chart">
                <UserProductivityChart />
            </ChartCard>

            {/* Row 3 Chart (Full Width) */}
            <ChartCard title="Trends Over Time" chartId="trends-area-chart">
                <TrendsAreaChart />
            </ChartCard>
        </div>
    );
}
